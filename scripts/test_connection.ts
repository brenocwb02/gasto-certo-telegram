import { createClient } from '@supabase/supabase-js'

const token = 'sbp_0fa7deef58931d7c66ac8fd4cf85fe4f148218bc';
const projectId = 'dnpwlpxugkzomqczijwy';

async function listProjects() {
  console.log('Verifying access with provided token...');
  
  try {
    const response = await fetch('https://api.supabase.com/v1/projects', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const projects = await response.json();
    const targetProject = projects.find((p: any) => p.id === projectId);

    if (targetProject) {
        console.log(`✅ Success! Found project: ${targetProject.name} (${targetProject.id})`);
        console.log(`Status: ${targetProject.status}`);
        console.log(`Region: ${targetProject.region}`);
    } else {
        console.log('❌ Project not found in account list.');
        console.log('Available projects:', projects.map((p: any) => `${p.name} (${p.id})`).join(', '));
    }

  } catch (error) {
    console.error('Error listing projects:', error);
  }
}

listProjects();
