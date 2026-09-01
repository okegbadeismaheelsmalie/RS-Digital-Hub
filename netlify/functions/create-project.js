export default async (request) => {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" }
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

    // ---------------------------------------------------------
    // Validate required information
    // ---------------------------------------------------------

    if (!name || !email || !phone || !service || !description) {
      return new Response(
        JSON.stringify({
          error: "Please complete all required project information."
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // ---------------------------------------------------------
    // Supabase configuration
    // ---------------------------------------------------------

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseSecret = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecret) {
      return new Response(
        JSON.stringify({
          error: "Server configuration is incomplete."
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const headers = {
      "Content-Type": "application/json",
      "apikey": supabaseSecret,
      "Authorization": `Bearer ${supabaseSecret}`
    };

   // Find the selected service
const serviceResponse = await fetch(
`${supabaseUrl}/rest/v1/services?select=id,name`,
{
method: "GET",
headers
}
);
const services = await serviceResponse.json();
if (!serviceResponse.ok || !Array.isArray(services)) {
console.error("Supabase service lookup error:", services);
return new Response(
JSON.stringify({
error: "Could not load services from the database."
}),
{
status: 500,
headers: { "Content-Type": "application/json"}
}
);
}
// Match service safely
const selectedService = String(service)
.trim()
.toLowerCase();
const matchedService = services.find((item) =>{
return (
typeof item.name === "string"&&
item.name.trim().toLowerCase() === selectedService
);
});
if (!matchedService) {
console.error("Service not found:", service);
console.error("Available services:", services);
return new Response(
JSON.stringify({
error: `The selected service "${service}"could not be found.`
}),
{
status: 404,
headers: { "Content-Type": "application/json"}
}
);
}
const serviceId = matchedService.id;


    // ---------------------------------------------------------
    // Generate next project code
    // ---------------------------------------------------------

    const projectCodeResponse = await fetch(
      `${supabaseUrl}/rest/v1/projects?select=project_code&order=created_at.desc&limit=1`,
      {
        method: "GET",
        headers
      }
    );

    const latestProjects = await projectCodeResponse.json();

    let nextNumber = 1;

    if (
      projectCodeResponse.ok &&
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

    const projectCode = `RDH-${String(nextNumber).padStart(4, "0")}`;

    // ---------------------------------------------------------
    // Create project
    // ---------------------------------------------------------

    const projectResponse = await fetch(
      `${supabaseUrl}/rest/v1/projects`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          project_code: projectCode,

          // Public requests don't have a logged-in client yet.
          client_id: null,

          service_id: serviceId,

          title: `${service} Project`,

          description: `Client Name: ${name}
Email: ${email}
Phone: ${phone}

Project Details:
${description}`,

          budget: budget || null,
          status: "new",
          progress: 0,
          start_date: null,
          deadline: deadline || null
        })
      }
    );

    const result = await projectResponse.json();

    if (!projectResponse.ok) {
      console.error("Supabase project error:", result);

      return new Response(
        JSON.stringify({
          error: "Project could not be created.",
          details: result
        }),
        {
          status: projectResponse.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // ---------------------------------------------------------
    // Success
    // ---------------------------------------------------------

    return new Response(
      JSON.stringify({
        success: true,
        project: result[0]
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Create project error:", error);

    return new Response(
      JSON.stringify({
        error: "Something went wrong while creating the project."
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};