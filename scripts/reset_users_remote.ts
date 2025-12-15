
import { createClient } from '@supabase/supabase-js'

const token = 'sbp_0fa7deef58931d7c66ac8fd4cf85fe4f148218bc';
const projectId = 'dnpwlpxugkzomqczijwy';
const projectUrl = 'https://dnpwlpxugkzomqczijwy.supabase.co';

async function resetUsers() {
    console.log('🔄 Starting user reset process...');

    try {
        // 1. Fetch Service Role Key using Management API
        console.log('🔑 Fetching Service Role Key...');
        const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/api-keys`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch keys: ${response.statusText}`);
        }

        const keys = await response.json();
        const serviceRoleKey = keys.find((k: any) => k.name === 'service_role')?.api_key;

        if (!serviceRoleKey) {
            throw new Error('Service Role Key not found!');
        }
        console.log('✅ Service Role Key acquired.');

        // 2. Initialize Supabase Admin Client
        const supabaseAdmin = createClient(projectUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 3. List and Delete Users
        console.log('👥 Listing users...');
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

        if (listError) throw listError;

        if (!users || users.length === 0) {
            console.log('✨ No users found to delete.');
            return;
        }

        console.log(`🗑️ Found ${users.length} users. Deleting...`);

        for (const user of users) {
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
            if (deleteError) {
                console.error(`❌ Failed to delete ${user.email}:`, deleteError.message);
            } else {
                console.log(`✅ Deleted: ${user.email}`);
            }
        }

        console.log('🎉 Reset complete! All users deleted.');

    } catch (error) {
        console.error('❌ Error during reset:', error);
        process.exit(1);
    }
}

resetUsers();
