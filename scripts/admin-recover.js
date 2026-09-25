import 'dotenv/config';

const { recoverAdminPassword } = await import('../supabase-db.js');

const newPassword = process.env.ADMIN_NEW_PASSWORD;

if (!newPassword || newPassword.length < 8) {
  console.error(
    'ADMIN_NEW_PASSWORD must be set and at least 8 characters long.'
  );
  process.exit(1);
}

try {
  const result = await recoverAdminPassword(newPassword);

  console.log(
    `Administrator password reset completed for ${result.email}.`
  );
  console.log(`Provider: ${result.provider}`);
} catch (error) {
  console.error(
    `Administrator password recovery failed: ${error.message}`
  );
  process.exit(1);
}