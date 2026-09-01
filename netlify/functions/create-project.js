export default async (request) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers
    });
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers
      }
    );
  }

  try {
    const body = await request.json();

    const {
      name,
      email,
      phone,
      service,
      budget,
      deadline,
      description
    } = body;

    // ------------------------------------------------------------
    // Validate incoming project request
    // ------------------------------------------------------------

    if (!name || !email || !phone || !service || !description) {
      return new Response(
        JSON.stringify({
          error: "Please complete all required project information."
        }),
        {
          status: 400,
          headers
        }
      );
    }

    // ------------------------------------------------------------
    // Supabase configuration
    // ------------------------------------------------------------

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseSecret = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecret) {
      return new Response(
        JSON.stringify({
          error: "Server configuration is incomplete."
        }),
        {
          status: 500,
          headers
        }
      );
    }

    const supabaseHeaders = {
      "Content-Type": "application/json",
      "apikey": supabaseSecret,
      "Authorization": `Bearer ${supabaseSecret}`
    };

    // ------------------------------------------------------------
    // Helper for Supabase REST requests
    // ------------------------------------------------------------

    async function supabaseFetch(path, options = {}) {
      return fetch(`${supabaseUrl}${path}`, {
        ...options,
        headers: {
          ...supabaseHeaders,
          ...(options.headers || {})
        }
      });
    }

    // ------------------------------------------------------------
    // 1. Find the selected service
    // ------------------------------------------------------------

    const serviceResponse = await supabaseFetch(
      `/rest/v1/services?name=eq.${encodeURIComponent(service)}&select=id,name&limit=1`
    );

    const serviceResult = await serviceResponse.json();

    if (!serviceResponse.ok) {
      console.error("Service lookup failed:", serviceResult);

      return new Response(
        JSON.stringify({
          error: "Unable to find the selected service."
        }),
        {
          status: 500,
          headers
        }
      );
    }

    if (!Array.isArray(serviceResult) || serviceResult.length === 0) {
      return new Response(
        JSON.stringify({
          error: `The selected service "${service}" was not found.`
        }),
        {
          status: 400,
          headers
        }
      );
    }

    const serviceId = serviceResult[0].id;

    // ------------------------------------------------------------
    // 2. Find an existing Supabase Auth user by email
    // ------------------------------------------------------------

    let authUser = null;

    for (let page = 1; page <= 10 && !authUser; page++) {
      const usersResponse = await supabaseFetch(
        `/auth/v1/admin/users?page=${page}&per_page=100`
      );

      const usersResult = await usersResponse.json();

      if (!usersResponse.ok) {
        console.error("Auth user lookup failed:", usersResult);

        return new Response(
          JSON.stringify({
            error: "Unable to check the customer account."
          }),
          {
            status: 500,
            headers
          }
        );
      }

      const users = usersResult?.users || [];

      authUser = users.find(
        (user) =>
          typeof user.email === "string" &&
          user.email.toLowerCase() === email.toLowerCase()
      );

      if (users.length < 100) {
        break;
      }
    }

    // ------------------------------------------------------------
    // 3. Create the Auth user if this customer doesn't exist
    // ------------------------------------------------------------

    if (!authUser) {
      const createUserResponse = await supabaseFetch(
        "/auth/v1/admin/users",
        {
          method: "POST",
          body: JSON.stringify({
            email,
            email_confirm: true,
            user_metadata: {
              full_name: name,
              phone
            }
          })
        }
      );

      const createUserResult = await createUserResponse.json();

      if (!createUserResponse.ok) {
        console.error("Auth user creation failed:", createUserResult);

        return new Response(
          JSON.stringify({
            error: "Unable to create the customer account.",
            details: createUserResult
          }),
          {
            status: createUserResponse.status,
            headers
          }
        );
      }

      authUser = createUserResult.user || createUserResult;
    }

    if (!authUser?.id) {
      return new Response(
        JSON.stringify({
          error: "Customer account could not be identified."
        }),
        {
          status: 500,
          headers
        }
      );
    }

    const clientId = authUser.id;

    // ------------------------------------------------------------
    // 4. Create or update the customer's profile
    // ------------------------------------------------------------

    const profileCheckResponse = await supabaseFetch(
      `/rest/v1/profiles?id=eq.${encodeURIComponent(clientId)}&select=id&limit=1`
    );

    const profileCheckResult = await profileCheckResponse.json();

    if (!profileCheckResponse.ok) {
      console.error("Profile lookup failed:", profileCheckResult);

      return new Response(
        JSON.stringify({
          error: "Unable to access the customer profile."
        }),
        {
          status: 500,
          headers
        }
      );
    }

    if (Array.isArray(profileCheckResult) && profileCheckResult.length > 0) {
      const updateProfileResponse = await supabaseFetch(
        `/rest/v1/profiles?id=eq.${encodeURIComponent(clientId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            role: "client",
            full_name: name,
            phone
          })
        }
      );

      if (!updateProfileResponse.ok) {
        const updateResult = await updateProfileResponse.json();

        console.error("Profile update failed:", updateResult);

        return new Response(
          JSON.stringify({
            error: "Unable to update the customer profile."
          }),
          {
            status: 500,
            headers
          }
        );
      }
    } else {
      const createProfileResponse = await supabaseFetch(
        "/rest/v1/profiles",
        {
          method: "POST",
          body: JSON.stringify({
            id: clientId,
            role: "client",
            full_name: name,
            phone
          })
        }
      );

      if (!createProfileResponse.ok) {
        const createProfileResult = await createProfileResponse.json();

        console.error(
          "Profile creation failed:",
          createProfileResult
        );

        return new Response(
          JSON.stringify({
            error: "Unable to create the customer profile."
          }),
          {
            status: 500,
            headers
          }
        );
      }
    }

    // ------------------------------------------------------------
    // 5. Generate the next RS Digital Hub project code
    // ------------------------------------------------------------

    const latestProjectResponse = await supabaseFetch(
      "/rest/v1/projects?select=project_code&order=created_at.desc&limit=1"
    );

    const latestProjects = await latestProjectResponse.json();

    if (!latestProjectResponse.ok) {
      console.error(
        "Latest project lookup failed:",
        latestProjects
      );

      return new Response(
        JSON.stringify({
          error: "Unable to generate the project code."
        }),
        {
          status: 500,
          headers
        }
      );
    }

    let nextNumber = 1;

    if (
      Array.isArray(latestProjects) &&
      latestProjects.length > 0
    ) {
      const latestCode = latestProjects[0].project_code;

      if (typeof latestCode === "string") {
        const match = latestCode.match(/^RDH-(\d+)$/);

        if (match) {
          nextNumber = Number(match[1]) + 1;
        }
      }
    }

    const projectCode =
      `RDH-${String(nextNumber).padStart(4, "0")}`;

    // ------------------------------------------------------------
    // 6. Create the project
    // ------------------------------------------------------------

    const projectResponse = await supabaseFetch(
      "/rest/v1/projects",
      {
        method: "POST",
        headers: {
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          project_code: projectCode,
          client_id: clientId,
          service_id: serviceId,
          title: `${service} Project`,
          description,
          budget: budget ? Number(budget) : null,
          status: "new",
          progress: 0,
          start_date: null,
          deadline: deadline || null
        })
      }
    );

    const projectResult = await projectResponse.json();

    if (!projectResponse.ok) {
      console.error(
        "Project creation failed:",
        projectResult
      );

      return new Response(
        JSON.stringify({
          error: "Project could not be created.",
          details: projectResult
        }),
        {
          status: projectResponse.status,
          headers
        }
      );
    }

    // ------------------------------------------------------------
    // 7. Success
    // ------------------------------------------------------------

    return new Response(
      JSON.stringify({
        success: true,
        project_code: projectCode,
        project: Array.isArray(projectResult)
          ? projectResult[0]
          : projectResult
      }),
      {
        status: 201,
        headers
      }
    );

  } catch (error) {
    console.error("Create project error:", error);

    return new Response(
      JSON.stringify({
        error: "Invalid project request."
      }),
      {
        status: 400,
        headers
      }
    );
  }
};
