import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { firebaseAdmin } from '../src/lib/firebase-admin';

const prisma = new PrismaClient();

async function syncFirebaseUser(email: string, password: string, displayName: string): Promise<string> {
    try {
        const user = await firebaseAdmin.auth().createUser({
            email,
            password,
            displayName,
        });
        return user.uid;
    } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
            const user = await firebaseAdmin.auth().getUserByEmail(email);
            // Ensure password is reset to 'password123' for ease of use in demo environments
            await firebaseAdmin.auth().updateUser(user.uid, { password, displayName });
            return user.uid;
        }
        throw error;
    }
}

async function main() {
    console.log('Seeding VNSGU Demo Environment... Syncing with Firebase!');

    // Hash standard password for seed users
    const passwordHash = await bcrypt.hash('password123', 12);

    // 1. Superadmin User
    const saUid = await syncFirebaseUser('admin@nep-scheduler.com', 'password123', 'superadmin');
    const superadmin = await prisma.user.upsert({
        where: { username: 'superadmin' },
        update: { firebaseUid: saUid },
        create: {
            username: 'superadmin',
            email: 'admin@nep-scheduler.com',
            passwordHash,
            firebaseUid: saUid,
            role: 'SUPERADMIN',
        },
    });
    console.log(`Created SuperAdmin: ${superadmin.username} (Firebase UID: ${saUid})`);

    // 2. University
    const university = await prisma.university.upsert({
        where: { shortName: 'vnsgu' },
        update: {},
        create: {
            name: 'Veer Narmad South Gujarat University',
            shortName: 'vnsgu',
            location: 'Surat, Gujarat',
            email: 'vc@vnsgu.ac.in',
            estYear: 1965,
            website: 'vnsgu.ac.in',
        },
    });
    console.log(`Created University: ${university.name}`);

    // 3. University Admin User
    const uaUid = await syncFirebaseUser('admin@vnsgu.ac.in', 'password123', 'admin_vnsgu');
    const uniAdmin = await prisma.user.upsert({
        where: { username: 'admin_vnsgu' },
        update: { firebaseUid: uaUid },
        create: {
            username: 'admin_vnsgu',
            email: 'admin@vnsgu.ac.in',
            passwordHash,
            firebaseUid: uaUid,
            role: 'UNI_ADMIN',
            universityId: university.id,
            entityId: university.id,
        },
    });
    console.log(`Created Uni Admin: ${uniAdmin.username} (Firebase UID: ${uaUid})`);

    // Update University with Admin User
    await prisma.university.update({
        where: { id: university.id },
        data: { adminUserId: uniAdmin.id },
    });

    // 4. Department
    const department = await prisma.department.create({
        data: {
            universityId: university.id,
            name: 'Department of Computer Science',
            shortName: 'DCS',
            hod: 'Dr. Apurva Desai',
            email: 'dcs@vnsgu.ac.in',
        },
    });
    console.log(`Created Department: ${department.name}`);

    // 5. Department Admin User
    const daUid = await syncFirebaseUser('admin_dcs@vnsgu.ac.in', 'password123', 'admin_dcs_vnsgu');
    const deptAdmin = await prisma.user.upsert({
        where: { username: 'admin_dcs_vnsgu' },
        update: { firebaseUid: daUid },
        create: {
            username: 'admin_dcs_vnsgu',
            email: 'admin_dcs@vnsgu.ac.in',
            passwordHash,
            firebaseUid: daUid,
            role: 'DEPT_ADMIN',
            universityId: university.id,
            entityId: department.id,
        },
    });
    console.log(`Created Dept Admin: ${deptAdmin.username} (Firebase UID: ${daUid})`);

    // Update Department with Admin User
    await prisma.department.update({
        where: { id: department.id },
        data: { adminUserId: deptAdmin.id },
    });

    // 6. Resources (Classrooms & Labs)
    const resources = [
        { name: 'CS Classroom 101', type: 'Classroom', capacity: 60, floor: '1st' },
        { name: 'CS Classroom 102', type: 'Classroom', capacity: 60, floor: '1st' },
        { name: 'CS Classroom 201', type: 'Classroom', capacity: 40, floor: '2nd' },
        { name: 'CS Lab A', type: 'Lab', capacity: 30, floor: 'Ground' },
        { name: 'CS Lab B', type: 'Lab', capacity: 30, floor: 'Ground' },
    ];

    for (const res of resources) {
        await prisma.resource.create({
            data: {
                ...res,
                universityId: university.id,
            },
        });
    }
    console.log(`Created ${resources.length} Resources`);

    // 7. Batches (MCA Sem 2)
    const batchA = await prisma.batch.create({
        data: {
            universityId: university.id,
            departmentId: department.id,
            name: 'MCA Sem 2 Div A 2025-26',
            program: 'MCA',
            semester: 2,
            division: 'A',
            year: '2025-26',
            strength: 30,
        },
    });

    const batchB = await prisma.batch.create({
        data: {
            universityId: university.id,
            departmentId: department.id,
            name: 'MCA Sem 2 Div B 2025-26',
            program: 'MCA',
            semester: 2,
            division: 'B',
            year: '2025-26',
            strength: 30,
        },
    });
    console.log(`Created 2 Batches`);

    // 8. Courses for MCA Sem 2
    const coursesData = [
        { name: 'Artificial Intelligence', code: '201', type: 'Theory', credits: 4, weeklyHrs: 4 },
        { name: 'Frontend Technologies', code: '202', type: 'Theory+Lab', credits: 4, weeklyHrs: 6 },
        { name: '.Net using C#', code: '203', type: 'Theory+Lab', credits: 4, weeklyHrs: 6 },
        { name: 'Blockchain', code: '204', type: 'Theory', credits: 4, weeklyHrs: 4 },
        { name: 'Python', code: 'Python-204', type: 'Theory+Lab', credits: 4, weeklyHrs: 6 },
        { name: 'iOS Development', code: '205', type: 'Theory+Lab', credits: 4, weeklyHrs: 6 },
        { name: 'Android Development', code: 'Android-205', type: 'Theory+Lab', credits: 4, weeklyHrs: 6 },
    ];

    const createdCourses = await Promise.all(
        coursesData.map(c =>
            prisma.course.create({
                data: {
                    ...c,
                    universityId: university.id,
                    departmentId: department.id,
                    program: 'MCA'
                }
            })
        )
    );
    console.log(`Created ${createdCourses.length} Courses`);

    // Helper to find course ID by name
    const getCourse = (name: string) => createdCourses.find(c => c.name === name)!.id;

    // 9. Faculty Members & Subject Mapping
    const facultyList = [
        { name: 'Rustam Morena', email: 'rustam@vnsgu.ac.in', subjects: ['Blockchain'] },
        { name: 'Ravi Gulati', email: 'ravi@vnsgu.ac.in', subjects: ['Python'] },
        { name: 'Dharmen Shah', email: 'dharmen@vnsgu.ac.in', subjects: ['.Net using C#', 'iOS Development'] },
        { name: 'Nimisha', email: 'nimisha@vnsgu.ac.in', subjects: ['Android Development'] },
        { name: 'Jayshree Patel', email: 'jayshree@vnsgu.ac.in', subjects: ['.Net using C#'] },
        { name: 'Mayur', email: 'mayur@vnsgu.ac.in', subjects: ['Android Development'] },
        { name: 'Prakash Rana', email: 'prakash@vnsgu.ac.in', subjects: ['Artificial Intelligence'] },
        { name: 'Vimal', email: 'vimal@vnsgu.ac.in', subjects: ['Frontend Technologies'] },
        { name: 'Rinku', email: 'rinku@vnsgu.ac.in', subjects: ['Frontend Technologies'] },
    ];

    for (const f of facultyList) {
        const username = f.email.split('@')[0];

        // Ensure user is in Firebase Context
        const fUid = await syncFirebaseUser(f.email, 'password123', f.name);

        // Upsert User for Faculty
        const user = await prisma.user.upsert({
            where: { username },
            update: {
                email: f.email,
                role: 'FACULTY',
                firebaseUid: fUid,
                universityId: university.id,
            },
            create: {
                username,
                email: f.email,
                passwordHash,
                firebaseUid: fUid,
                role: 'FACULTY',
                universityId: university.id,
            },
        });

        const faculty = await prisma.faculty.upsert({
            where: { email: f.email },
            update: {
                universityId: university.id,
                name: f.name,
                userId: user.id,
                designation: 'Assistant Professor'
            },
            create: {
                universityId: university.id,
                name: f.name,
                email: f.email,
                userId: user.id,
                designation: 'Assistant Professor'
            },
        });

        // Ensure Faculty is mapped to the department
        await prisma.facultyDepartment.upsert({
            where: {
                facultyId_departmentId: {
                    facultyId: faculty.id,
                    departmentId: department.id
                }
            },
            update: {},
            create: {
                facultyId: faculty.id,
                departmentId: department.id
            }
        });

        // Update entityId in User
        await prisma.user.update({
            where: { id: user.id },
            data: { entityId: faculty.id }
        });

        // Map subjects
        for (const sub of f.subjects) {
            await prisma.facultySubject.create({
                data: {
                    facultyId: faculty.id,
                    courseId: getCourse(sub)
                }
            });
        }
    }
    console.log(`Created ${facultyList.length} Faculty Members & Assigned Subjects`);

    console.log('Seeding Complete! 🎉');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
