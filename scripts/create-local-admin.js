import { Client } from 'pg'

const client = new Client({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'chickenbanana'
})

async function main() {
  const email = process.argv[2] || 'parrokitty@gmail.com'
  await client.connect()
  try {
    const q = `
      INSERT INTO public.users (email, is_admin, role, kyc_status, kyc_approved_at, admin_granted_at, created_at)
      VALUES ($1, true, 'admin', 'approved', now(), now(), now())
      ON CONFLICT (email) DO UPDATE
      SET is_admin = TRUE,
          role = 'admin',
          kyc_status = 'approved',
          kyc_approved_at = now(),
          admin_granted_at = now(),
          email = EXCLUDED.email
      RETURNING id, email, is_admin, role, kyc_status;
    `
    const res = await client.query(q, [email])
    console.log('Admin upsert result:', res.rows[0])
  } catch (err) {
    console.error('Error creating admin:', err.message || err)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

await main()
