
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const db = getDb();
  let details: any = {};

  if (user.role === 'STUDENT' && user.student_id) {
    const sRes = await db.execute({
      sql: `
        SELECT s.*, c.name as class_name, sec.name as section_name, 
               p.father_name, p.mother_name, p.primary_phone as parent_phone, p.address
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN sections sec ON s.section_id = sec.id
        LEFT JOIN parents p ON s.parent_id = p.id
        WHERE s.id = ?
      `,
      args: [user.student_id]
    });
    details.student = sRes.rows[0] || null;
  } else if ((user.role === 'STAFF' || user.role === 'SADR' || user.teacher_id) && (user.teacher_id || user.role === 'SADR' || user.username === 'sadr')) {
    const tId = user.teacher_id || 28;
    const tRes = await db.execute({
      sql: `
        SELECT t.*, 
               c1.name as assigned_class_name, sec1.name as assigned_section_name,
               c2.name as assigned_class_name_2, sec2.name as assigned_section_name_2
        FROM teachers t
        LEFT JOIN classes c1 ON c1.id = t.assigned_class_id
        LEFT JOIN sections sec1 ON sec1.id = t.assigned_section_id
        LEFT JOIN classes c2 ON c2.id = t.assigned_class_id_2
        LEFT JOIN sections sec2 ON sec2.id = t.assigned_section_id_2
        WHERE t.id = ?
      `,
      args: [tId]
    });
    const teacherData = tRes.rows[0] ? { ...tRes.rows[0] } : null;
    if (teacherData) {
      const assignedList = [];
      if (teacherData.assigned_class_id && teacherData.assigned_section_id) {
        assignedList.push({
          classId: Number(teacherData.assigned_class_id),
          className: String(teacherData.assigned_class_name || ''),
          wing: String(teacherData.assigned_wing || 'Boys'),
          sectionId: Number(teacherData.assigned_section_id)
        });
      }
      if (teacherData.assigned_class_id_2 && teacherData.assigned_section_id_2) {
        assignedList.push({
          classId: Number(teacherData.assigned_class_id_2),
          className: String(teacherData.assigned_class_name_2 || ''),
          wing: String(teacherData.assigned_wing_2 || 'Boys'),
          sectionId: Number(teacherData.assigned_section_id_2)
        });
      }
      (teacherData as any).assignedClassesList = assignedList;
    }
    const assignRes = await db.execute({
      sql: `
        SELECT ta.*, c.name as class_name, sec.name as section_name, sub.name as subject_name, sub.code as subject_code
        FROM teacher_assignments ta
        JOIN sections sec ON ta.section_id = sec.id
        JOIN classes c ON sec.class_id = c.id
        JOIN subjects sub ON ta.subject_id = sub.id
        WHERE ta.teacher_id = ?
      `,
      args: [tId]
    });
    // Find if class teacher of any section
    const ctRes = await db.execute({
      sql: `
        SELECT sec.*, c.name as class_name
        FROM sections sec
        JOIN classes c ON sec.class_id = c.id
        WHERE sec.class_teacher_id = ?
      `,
      args: [tId]
    });

    details.teacher = teacherData;
    details.assignments = assignRes.rows || [];
    details.classTeacherSections = ctRes.rows || [];
  } else if (user.role === 'PARENT' && user.parent_id) {
    const pRes = await db.execute({
      sql: 'SELECT * FROM parents WHERE id = ?',
      args: [user.parent_id]
    });
    const childrenRes = await db.execute({
      sql: `
        SELECT s.*, c.name as class_name, sec.name as section_name
        FROM students s
        JOIN classes c ON s.class_id = c.id
        JOIN sections sec ON s.section_id = sec.id
        WHERE s.parent_id = ?
      `,
      args: [user.parent_id]
    });
    details.parent = pRes.rows[0] || null;
    details.children = childrenRes.rows || [];
  }

  return NextResponse.json({
    user,
    details,
    student: details.student || null,
    teacher: details.teacher || null,
    parent: details.parent || null
  });
}
