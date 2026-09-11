const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

const db = createClient({ url: 'file:./madrassa.db' });

async function seedData() {
  console.log('Seeding core records with strict null defaults...');
  const clearTables = [
    'marks', 'exam_subjects', 'exams', 'attendance', 'fees', 'achievements',
    'correction_requests', 'students', 'parents', 'teacher_assignments', 'sections',
    'subjects', 'classes', 'teachers', 'announcements', 'events', 'gallery',
    'audit_logs', 'website_settings', 'academic_years', 'users'
  ];
  for (const t of clearTables) {
    await db.execute(`DELETE FROM ${t};`);
  }

  const defaultHash = await bcrypt.hash('madrassa123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);
  const officeHash = await bcrypt.hash('office123', 10);

  // 1. Academic Year
  await db.execute({
    sql: 'INSERT INTO academic_years (name, is_current, start_date, end_date) VALUES (?, 1, ?, ?)',
    args: ['2026-2027', '2026-06-01', '2027-04-30']
  });
  const ay = await db.execute('SELECT id FROM academic_years WHERE is_current = 1');
  const academicYearId = Number(ay.rows[0].id);

  // 2. Admins
  await db.execute({
    sql: 'INSERT INTO users (username, password_hash, role, full_name, email, phone) VALUES (?, ?, ?, ?, ?, ?)',
    args: ['admin', adminHash, 'SUPER_ADMIN', 'Head Administrator', 'admin@mifthahululoom.edu.in', '+91 98470 11223']
  });
  await db.execute({
    sql: 'INSERT INTO users (username, password_hash, role, full_name, email, phone) VALUES (?, ?, ?, ?, ?, ?)',
    args: ['office', officeHash, 'OFFICE_ADMIN', 'Madrassa Office Desk', 'office@mifthahululoom.edu.in', '+91 495 272 8840']
  });

  // 3. Classes
  const classNames = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', '+1', '+2'];
  const classIdMap = {};
  for (let i = 0; i < classNames.length; i++) {
    const res = await db.execute({
      sql: 'INSERT INTO classes (name, display_order, numeric_order) VALUES (?, ?, ?)',
      args: [classNames[i], i + 1, i + 1]
    });
    classIdMap[classNames[i]] = Number(res.lastInsertRowid);
  }

  // 4. Teachers
  const teacherList = [
    { username: 'abdulrahman', name: 'Usthad Abdul Rahman Faizy', gender: 'Male', phone: '+91 94471 23456', email: 'abdulrahman@mifthahululoom.edu.in', qual: 'M.A. Arabic, Baqawi', desig: 'Headmaster / Senior Usthad' },
    { username: 'muhammadali', name: 'Usthad Muhammad Ali Zahri', gender: 'Male', phone: '+91 94472 34567', email: 'muhammadali@mifthahululoom.edu.in', qual: 'Qari, Al-Alimiyya', desig: 'Senior Tajweed & Tafseer Usthad' },
    { username: 'ibrahimkoya', name: 'Usthad Ibrahim Koya Musliyar', gender: 'Male', phone: '+91 94473 45678', email: 'ibrahimkoya@mifthahululoom.edu.in', qual: 'M.A. Islamic Studies, Hasani', desig: 'Fiqh & Hadith Usthad' },
    { username: 'ahmedfaiz', name: 'Usthad Ahmed Faizul Haque', gender: 'Male', phone: '+91 94474 56789', email: 'ahmedfaiz@mifthahululoom.edu.in', qual: 'M.Sc. Mathematics, B.Ed', desig: 'Mathematics & Science Teacher' },
    { username: 'zainab', name: 'Usthada Zainab Binth Umar', gender: 'Female', phone: '+91 94475 67890', email: 'zainab@mifthahululoom.edu.in', qual: 'Afzal-ul-Ulama, M.A. English', desig: 'Girls Section Head / English Faculty' },
    { username: 'fathima', name: 'Usthada Fathimat-uz-Zahra', gender: 'Female', phone: '+91 94476 78901', email: 'fathima@mifthahululoom.edu.in', qual: 'Hafidha, Islamic Studies Degree', desig: 'Quran & Islamic History Faculty' }
  ];

  const teacherIdMap = {};
  for (let i = 0; i < teacherList.length; i++) {
    const t = teacherList[i];
    const uRes = await db.execute({
      sql: 'INSERT INTO users (username, password_hash, role, full_name, email, phone) VALUES (?, ?, ?, ?, ?, ?)',
      args: [t.username, defaultHash, 'STAFF', t.name, t.email, t.phone]
    });
    const uId = Number(uRes.lastInsertRowid);
    const tRes = await db.execute({
      sql: 'INSERT INTO teachers (user_id, staff_id, full_name, gender, phone, email, qualification, designation, joining_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [uId, `STAFF-00${i + 1}`, t.name, t.gender, t.phone, t.email, t.qual, t.desig, '2020-05-15']
    });
    teacherIdMap[t.username] = Number(tRes.lastInsertRowid);
  }

  // 5. Sections
  const sectionIdMap = {};
  for (const cName of classNames) {
    const cId = classIdMap[cName];
    const bTeacher = (cName === 'Class 9' || cName === 'Class 10') ? teacherIdMap['muhammadali'] : ((cName === '+1' || cName === '+2') ? teacherIdMap['ibrahimkoya'] : teacherIdMap['abdulrahman']);
    const gTeacher = (cName === 'Class 9' || cName === 'Class 10') ? teacherIdMap['fathima'] : teacherIdMap['zainab'];

    const bRes = await db.execute({
      sql: 'INSERT INTO sections (class_id, name, gender, class_teacher_id) VALUES (?, ?, ?, ?)',
      args: [cId, 'Boys', 'Boys', bTeacher]
    });
    sectionIdMap[`${cName}_Boys`] = Number(bRes.lastInsertRowid);

    const gRes = await db.execute({
      sql: 'INSERT INTO sections (class_id, name, gender, class_teacher_id) VALUES (?, ?, ?, ?)',
      args: [cId, 'Girls', 'Girls', gTeacher]
    });
    sectionIdMap[`${cName}_Girls`] = Number(gRes.lastInsertRowid);
  }

  // 6. Subjects
  const subjects = [
    { name: 'Quran & Tajweed', code: 'QUR' },
    { name: 'Islamic Studies (Fiqh & Aqeedah)', code: 'ISL' },
    { name: 'Arabic Language & Grammar', code: 'ARB' },
    { name: 'Hadith Studies', code: 'HAD' },
    { name: 'English Language', code: 'ENG' },
    { name: 'Mathematics', code: 'MAT' },
    { name: 'General Science', code: 'SCI' },
    { name: 'Social Studies', code: 'SOC' },
    { name: 'Malayalam', code: 'MAL' }
  ];

  const subjectIdMap = {};
  for (const cName of classNames) {
    const cId = classIdMap[cName];
    for (const sub of subjects) {
      const res = await db.execute({
        sql: 'INSERT INTO subjects (name, code, class_id) VALUES (?, ?, ?)',
        args: [sub.name, `${sub.code}-${cName.replace(' ', '')}`, cId]
      });
      subjectIdMap[`${cName}_${sub.name}`] = Number(res.lastInsertRowid);
    }
  }

  // 7. Teacher Assignments
  const assignments = [
    { teacher: 'abdulrahman', class: 'Class 8', section: 'Boys', subject: 'Arabic Language & Grammar' },
    { teacher: 'abdulrahman', class: 'Class 8', section: 'Boys', subject: 'Hadith Studies' },
    { teacher: 'muhammadali', class: 'Class 8', section: 'Boys', subject: 'Quran & Tajweed' },
    { teacher: 'ibrahimkoya', class: 'Class 8', section: 'Boys', subject: 'Islamic Studies (Fiqh & Aqeedah)' },
    { teacher: 'ahmedfaiz', class: 'Class 8', section: 'Boys', subject: 'Mathematics' },
    { teacher: 'ahmedfaiz', class: 'Class 8', section: 'Boys', subject: 'General Science' },
    { teacher: 'zainab', class: 'Class 8', section: 'Girls', subject: 'English Language' },
    { teacher: 'zainab', class: 'Class 8', section: 'Girls', subject: 'Arabic Language & Grammar' },
    { teacher: 'fathima', class: 'Class 8', section: 'Girls', subject: 'Quran & Tajweed' },
    { teacher: 'fathima', class: 'Class 8', section: 'Girls', subject: 'Islamic Studies (Fiqh & Aqeedah)' },
    { teacher: 'muhammadali', class: 'Class 9', section: 'Boys', subject: 'Quran & Tajweed' },
    { teacher: 'abdulrahman', class: 'Class 9', section: 'Boys', subject: 'Arabic Language & Grammar' },
    { teacher: 'ibrahimkoya', class: 'Class 10', section: 'Boys', subject: 'Islamic Studies (Fiqh & Aqeedah)' },
    { teacher: 'zainab', class: 'Class 10', section: 'Girls', subject: 'English Language' }
  ];

  for (const a of assignments) {
    const tId = teacherIdMap[a.teacher];
    const sId = sectionIdMap[`${a.class}_${a.section}`];
    const subId = subjectIdMap[`${a.class}_${a.subject}`];
    if (tId && sId && subId) {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO teacher_assignments (teacher_id, section_id, subject_id) VALUES (?, ?, ?)',
        args: [tId, sId, subId]
      });
    }
  }

  // 8. Students & Parents
  const sampleStudents = [
    { name: 'Muhammad Zaid', gender: 'Boys', class: 'Class 8', roll: 1, dob: '2012-04-14', father: 'Abdul Lateef K.P', mother: 'Amina Lateef', phone: '9847111001', addr: 'Baitul Noor, Kuttichira, Kozhikode' },
    { name: 'Ahmad Rayan', gender: 'Boys', class: 'Class 8', roll: 2, dob: '2012-07-22', father: 'Umar Farooq V', mother: 'Suhaila Farooq', phone: '9847111002', addr: 'Darussalam, Meenchanda, Kozhikode' },
    { name: 'Bilal Hassan', gender: 'Boys', class: 'Class 8', roll: 3, dob: '2012-01-09', father: 'Hassan Kutty', mother: 'Fathima Hassan', phone: '9847111003', addr: 'Gulshan House, Feroke, Kozhikode' },
    { name: 'Umar Mukhtar', gender: 'Boys', class: 'Class 8', roll: 4, dob: '2012-09-30', father: 'Mukhtar Ahmad', mother: 'Zubaida Mukhtar', phone: '9847111004', addr: 'Al-Madina Manzil, Beypore, Kozhikode' },
    { name: 'Salmanul Faris', gender: 'Boys', class: 'Class 8', roll: 5, dob: '2012-11-15', father: 'Ibrahim Master', mother: 'Mariyam Ibrahim', phone: '9847111005', addr: 'Al-Huda Villa, Pantheerankavu, Kozhikode' },
    { name: 'Fatima Zahra', gender: 'Girls', class: 'Class 8', roll: 1, dob: '2012-03-18', father: 'Muhammad Shafi', mother: 'Khadija Shafi', phone: '9847222001', addr: 'Shafiya Manzil, Medical College, Kozhikode' },
    { name: 'Aisha Haneen', gender: 'Girls', class: 'Class 8', roll: 2, dob: '2012-06-05', father: 'Nasiruddin K', mother: 'Safeera Nasir', phone: '9847222002', addr: 'Al-Baraka, Nadakkavu, Kozhikode' },
    { name: 'Maryam Sulthana', gender: 'Girls', class: 'Class 8', roll: 3, dob: '2012-08-19', father: 'Sulaiman Master', mother: 'Rabiya Sulaiman', phone: '9847222003', addr: 'Darul Aman, West Hill, Kozhikode' },
    { name: 'Hafsa Binth Ali', gender: 'Girls', class: 'Class 8', roll: 4, dob: '2012-10-12', father: 'Ali Akbar', mother: 'Tahira Ali', phone: '9847222004', addr: 'Akbar Villa, Kallai, Kozhikode' },
    { name: 'Ammar Yasir', gender: 'Boys', class: 'Class 5', roll: 1, dob: '2015-05-10', father: 'Abdul Lateef K.P', mother: 'Amina Lateef', phone: '9847111001', addr: 'Baitul Noor, Kuttichira, Kozhikode' },
    { name: 'Hamza Nabeel', gender: 'Boys', class: 'Class 5', roll: 2, dob: '2015-08-25', father: 'Nabeel Ahmad', mother: 'Sumayya Nabeel', phone: '9847333002', addr: 'Yasmeen Manzil, Mankavu, Kozhikode' },
    { name: 'Khadija Nihala', gender: 'Girls', class: 'Class 5', roll: 1, dob: '2015-02-14', father: 'Abdul Kareem', mother: 'Sameera Kareem', phone: '9847444001', addr: 'Baitul Rahma, Olavanna, Kozhikode' },
    { name: 'Anas Thariq', gender: 'Boys', class: 'Class 10', roll: 1, dob: '2010-06-20', father: 'Thariq Aziz', mother: 'Jameela Thariq', phone: '9847555001', addr: 'Al-Haramain, Vengeri, Kozhikode' },
    { name: 'Suhail Musthafa', gender: 'Boys', class: 'Class 10', roll: 2, dob: '2010-09-12', father: 'Musthafa Kamal', mother: 'Bushra Musthafa', phone: '9847555002', addr: 'Kamal Nivas, Karaparamba, Kozhikode' },
    { name: 'Fidha Fathima', gender: 'Girls', class: 'Class 10', roll: 1, dob: '2010-04-08', father: 'Sayyid Munawwar', mother: 'Shameema Munawwar', phone: '9847666001', addr: 'Sayyid Manzil, Eranhipalam, Kozhikode' },
    { name: 'Shakir Hameed', gender: 'Boys', class: '+1', roll: 1, dob: '2009-02-15', father: 'Abdul Hameed', mother: 'Asma Hameed', phone: '9847777001', addr: 'Darul Uloom House, Chevayur, Kozhikode' },
    { name: 'Hanan Basheer', gender: 'Girls', class: '+1', roll: 1, dob: '2009-07-28', father: 'Basheer Koya', mother: 'Fouziya Basheer', phone: '9847777002', addr: 'Basheeriya, Mavoor Road, Kozhikode' },
    { name: 'Rashid Abdullah', gender: 'Boys', class: '+2', roll: 1, dob: '2008-05-11', father: 'Abdullah Kutty', mother: 'Maimoona Abdullah', phone: '9847888001', addr: 'Baitul Izza, Kunnamangalam, Kozhikode' },
    { name: 'Lubna Shireen', gender: 'Girls', class: '+2', roll: 1, dob: '2008-08-30', father: 'Shareef Master', mother: 'Raihanath Shareef', phone: '9847888002', addr: 'Shireen Villa, Pantheerankavu, Kozhikode' }
  ];

  const studentIdList = [];
  const parentIdMap = {};

  for (let idx = 0; idx < sampleStudents.length; idx++) {
    const s = sampleStudents[idx];
    const admissionNo = `MU2026-${String(idx + 1).padStart(4, '0')}`;
    const studentUsername = admissionNo;

    let parentId = parentIdMap[s.phone];
    if (!parentId) {
      const parentUsername = `P-${s.phone}`;
      const pUserRes = await db.execute({
        sql: 'INSERT INTO users (username, password_hash, role, full_name, email, phone) VALUES (?, ?, ?, ?, ?, ?)',
        args: [parentUsername, defaultHash, 'PARENT', s.father, `parent_${s.phone}@mifthahululoom.edu.in`, s.phone]
      });
      const pUserId = Number(pUserRes.lastInsertRowid);
      const pRes = await db.execute({
        sql: 'INSERT INTO parents (user_id, father_name, mother_name, primary_phone, address, emergency_contact) VALUES (?, ?, ?, ?, ?, ?)',
        args: [pUserId, s.father, s.mother, s.phone, s.addr, s.phone]
      });
      parentId = Number(pRes.lastInsertRowid);
      parentIdMap[s.phone] = parentId;
    }

    const sUserRes = await db.execute({
      sql: 'INSERT INTO users (username, password_hash, role, full_name, email, phone) VALUES (?, ?, ?, ?, ?, ?)',
      args: [studentUsername, defaultHash, 'STUDENT', s.name, `${studentUsername.toLowerCase()}@student.mifthahululoom.edu.in`, s.phone]
    });
    const sUserId = Number(sUserRes.lastInsertRowid);

    const classId = classIdMap[s.class];
    const sectionId = sectionIdMap[`${s.class}_${s.gender}`];

    const studentRes = await db.execute({
      sql: 'INSERT INTO students (user_id, admission_no, roll_no, full_name, dob, gender, class_id, section_id, admission_date, status, academic_year_id, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [sUserId, admissionNo, s.roll, s.name, s.dob, s.gender, classId, sectionId, '2026-06-01', 'Active', academicYearId, parentId]
    });
    const studentDbId = Number(studentRes.lastInsertRowid);
    studentIdList.push({ id: studentDbId, admissionNo, name: s.name, class: s.class, gender: s.gender, sectionId });

    // Fees: Rs 100/mo
    const feeMonths = [
      { m: 'June 2026', paid: true, date: '2026-06-05', mode: 'UPI', ref: 'UPI-2606-09823' },
      { m: 'July 2026', paid: true, date: '2026-07-04', mode: 'Cash', ref: 'CASH-REC-1120' },
      { m: 'August 2026', paid: idx % 3 !== 0, date: '2026-08-06', mode: 'UPI', ref: 'UPI-2608-55412' },
      { m: 'September 2026', paid: idx % 2 === 0, date: '2026-09-02', mode: 'Bank Transfer', ref: 'NEFT-889922' },
      { m: 'October 2026', paid: false },
      { m: 'November 2026', paid: false },
      { m: 'December 2026', paid: false },
      { m: 'January 2027', paid: false },
      { m: 'February 2027', paid: false },
      { m: 'March 2027', paid: false },
      { m: 'April 2027', paid: false },
      { m: 'May 2027', paid: false }
    ];

    for (let fIdx = 0; fIdx < feeMonths.length; fIdx++) {
      const fm = feeMonths[fIdx];
      const receiptNo = fm.paid ? `REC-2026-${String(idx * 12 + fIdx + 1).padStart(5, '0')}` : null;
      await db.execute({
        sql: 'INSERT INTO fees (student_id, academic_year_id, month, amount, status, paid_amount, payment_date, payment_mode, payment_reference, receipt_no, collected_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          studentDbId,
          academicYearId,
          fm.m,
          100,
          fm.paid ? 'Paid' : 'Pending',
          fm.paid ? 100 : 0,
          fm.paid ? fm.date : null,
          fm.paid ? fm.mode : null,
          fm.paid ? fm.ref : null,
          receiptNo,
          fm.paid ? 2 : null
        ]
      });
    }

    // Daily Attendance for 10 dates
    const attendanceDates = [
      '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14', '2026-08-16',
      '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21'
    ];
    for (let dIdx = 0; dIdx < attendanceDates.length; dIdx++) {
      const dt = attendanceDates[dIdx];
      let status = 'Present';
      if ((idx + dIdx) % 11 === 0) status = 'Absent';
      else if ((idx + dIdx) % 7 === 0) status = 'Late';

      await db.execute({
        sql: 'INSERT INTO attendance (student_id, section_id, date, status, remarks, marked_by_user_id) VALUES (?, ?, ?, ?, ?, ?)',
        args: [studentDbId, sectionId, dt, status, status === 'Late' ? 'Late by 10 mins' : null, 3]
      });
    }
  }

  // 9. Exams & Marks
  const examRes1 = await db.execute({
    sql: 'INSERT INTO exams (academic_year_id, name, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)',
    args: [academicYearId, 'First Term Monthly Assessment', '2026-07-15', '2026-07-20', 'Published']
  });
  const examId1 = Number(examRes1.lastInsertRowid);

  const examRes2 = await db.execute({
    sql: 'INSERT INTO exams (academic_year_id, name, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)',
    args: [academicYearId, 'First Mid-Term Grand Examination', '2026-08-10', '2026-08-18', 'Published']
  });
  const examId2 = Number(examRes2.lastInsertRowid);

  const class8Id = classIdMap['Class 8'];
  const class8Subjects = [
    'Quran & Tajweed', 'Islamic Studies (Fiqh & Aqeedah)', 'Arabic Language & Grammar',
    'Hadith Studies', 'English Language', 'Mathematics', 'General Science'
  ];

  for (const sName of class8Subjects) {
    const subId = subjectIdMap[`Class 8_${sName}`];
    if (subId) {
      await db.execute({
        sql: 'INSERT INTO exam_subjects (exam_id, subject_id, class_id, max_marks, pass_marks) VALUES (?, ?, ?, 100, 40)',
        args: [examId1, subId, class8Id]
      });
      await db.execute({
        sql: 'INSERT INTO exam_subjects (exam_id, subject_id, class_id, max_marks, pass_marks) VALUES (?, ?, ?, 100, 40)',
        args: [examId2, subId, class8Id]
      });
    }
  }

  const class8Students = studentIdList.filter(s => s.class === 'Class 8');
  for (const s of class8Students) {
    for (const sName of class8Subjects) {
      const subId = subjectIdMap[`Class 8_${sName}`];
      const baseMark = 70 + ((s.id * 7 + sName.length * 3) % 28);
      const markObtained = Math.min(100, Math.max(45, baseMark));
      let grade = 'B';
      if (markObtained >= 90) grade = 'A+';
      else if (markObtained >= 80) grade = 'A';
      else if (markObtained >= 70) grade = 'B+';
      else if (markObtained >= 60) grade = 'B';
      else if (markObtained >= 50) grade = 'C+';
      else if (markObtained >= 40) grade = 'C';
      else grade = 'F';

      await db.execute({
        sql: 'INSERT INTO marks (exam_id, subject_id, student_id, marks_obtained, grade, is_pass, remarks, entered_by_user_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [examId2, subId, s.id, markObtained, grade, markObtained >= 40 ? 1 : 0, markObtained >= 85 ? 'Excellent understanding' : 'Good progress', 3, 'Approved']
      });
    }
  }

  // 10. Achievements
  const achievementsData = [
    { studentIdx: 0, title: '1st Prize - State Quran Hifz & Tajweed Competition', event: 'Kerala State Madrassa Arts Fest 2026', pos: '1st Position (Gold Medal)', date: '2026-07-28', desc: 'Awarded first rank in 15 Para Hifz recitation with impeccable Tajweed articulation.' },
    { studentIdx: 1, title: '2nd Prize - All Kerala Arabic Elocution', event: 'Samastha Islamic Cultural Meet', pos: '2nd Position (Silver Medal)', date: '2026-06-25', desc: 'Delivered an eloquent Arabic speech on Islamic Moral Foundations in Modern Era.' },
    { studentIdx: 5, title: '1st Prize - Islamic Calligraphy & Quranic Inscription', event: 'District Inter-Madrassa Fest', pos: '1st Position', date: '2026-08-02', desc: 'Created masterful Thuluth and Diwani calligraphy pieces of Surah Ar-Rahman.' },
    { studentIdx: 7, title: '1st Prize - Hadith Recitation & Explanation', event: 'Annual Islamic Knowledge Bowl', pos: '1st Position', date: '2026-07-10', desc: 'Memorized and explained with chain of narration 40 An-Nawawi Hadiths.' },
    { studentIdx: 10, title: 'Junior Championship - Adhan Recitation', event: 'North Malabar Islamic Fest', pos: 'Champion', date: '2026-08-14', desc: 'Outstanding melodious Adhan delivery adhering to authentic Maqamat.' }
  ];

  for (const ach of achievementsData) {
    const st = studentIdList[ach.studentIdx];
    if (st) {
      await db.execute({
        sql: 'INSERT INTO achievements (student_id, title, competition_event, position, date, description, certificate_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [st.id, ach.title, ach.event, ach.pos, ach.date, ach.desc, null]
      });
    }
  }

  // 11. Announcements
  const announcementsData = [
    { title: 'Madrasa Reopening & New Academic Year Orientation 2026-2027', content: 'Classes for all academic levels from Class 1 to +2 have commenced. Orientation for Higher Secondary parents and students will be held this Saturday.', priority: 'High', audience: 'All' },
    { title: 'First Mid-Term Grand Examination Results Published', content: 'Results for the August 2026 Mid-Term Examinations are now accessible via Student and Parent Portals. Parents can view complete mark sheets and teacher evaluations.', priority: 'High', audience: 'All' },
    { title: 'Monthly Fee Remittance Reminder for August & September', content: 'Parents are requested to clear the nominal monthly fee of ₹100 for August and September. Online UPI/Bank Transfer and cash at Office counter are accepted.', priority: 'Medium', audience: 'Parents' },
    { title: 'Milad-un-Nabi & Da’wah Cultural Fest 2026 Registration Open', content: 'Registrations are now open for Quran Hifz, Qiraat, Arabic Calligraphy, Islamic Quiz, and Elocution competitions. Contact class teachers for registration forms.', priority: 'Medium', audience: 'Students' },
    { title: 'Staff Faculty Council Meeting — Academic Syllabus Review', content: 'All Usthads and teachers are requested to assemble in the Central Seminar Hall on Thursday at 4:30 PM for the quarterly curriculum review.', priority: 'Low', audience: 'Staff' }
  ];

  for (const a of announcementsData) {
    await db.execute({
      sql: 'INSERT INTO announcements (title, content, priority, target_audience, is_published, created_by_user_id) VALUES (?, ?, ?, ?, 1, 1)',
      args: [a.title, a.content, a.priority, a.audience]
    });
  }

  // 12. Events
  const eventsData = [
    { title: 'Grand Milad-un-Nabi & Islamic Cultural Summit 2026', desc: 'An auspicious spiritual gathering celebrating the blessed birth of Prophet Muhammad (PBUH) with Durood Majlis, student speeches, and community banquet.', date: '2026-09-16', time: '09:00 AM - 05:00 PM', loc: 'Madrassa Grand Auditorium', img: null },
    { title: 'Annual Quran Memorization (Hifz) Convocation', desc: 'Felicitation and Sanad awarding ceremony for 24 Huffaz completing the holy Quran under the guidance of our esteemed Tajweed faculty.', date: '2026-10-10', time: '10:00 AM - 01:30 PM', loc: 'Main Campus Hall', img: null },
    { title: 'State-Level Arabic Rhetoric & Science Exhibition', desc: 'A unique fusion exhibition presenting classical Islamic scientific contributions, Arabic literature pavilions, and modern STEM science projects by Madrassa students.', date: '2026-11-20', time: '09:30 AM - 04:30 PM', loc: 'Madrassa Exhibition Grounds', img: null }
  ];

  for (const ev of eventsData) {
    await db.execute({
      sql: 'INSERT INTO events (title, description, event_date, event_time, location, image_url, is_published) VALUES (?, ?, ?, ?, ?, ?, 1)',
      args: [ev.title, ev.desc, ev.date, ev.time, ev.loc, ev.img]
    });
  }

  // 13. Gallery
  const galleryData = [
    { title: 'Campus Main Gate & Islamic Architectural Facade', cat: 'Campus & Infrastructure', img: '/gallery/facade.jpg' },
    { title: 'Tajweed & Quran Hifz Circle in Session', cat: 'Academics', img: '/gallery/quran.jpg' },
    { title: 'Advanced Science Laboratory for Higher Secondary', cat: 'Laboratories', img: '/gallery/science.jpg' },
    { title: 'Central Islamic & General Reference Library', cat: 'Campus & Infrastructure', img: '/gallery/library.jpg' },
    { title: 'Annual Sports & Physical Fitness Meet', cat: 'Student Life', img: '/gallery/sports.jpg' },
    { title: 'Girls Wing Computer & Digital Technology Lab', cat: 'Laboratories', img: '/gallery/lab.jpg' },
    { title: 'State Arts Fest Winners Trophy Presentation', cat: 'Achievements', img: '/gallery/trophy.jpg' },
    { title: 'Daily Congregational Asr Prayer at Campus Masjid', cat: 'Spiritual Life', img: '/gallery/masjid.jpg' }
  ];

  for (const g of galleryData) {
    await db.execute({
      sql: 'INSERT INTO gallery (title, category, image_url) VALUES (?, ?, ?)',
      args: [g.title, g.cat, g.img]
    });
  }

  // 14. Website CMS Settings
  const settingsData = {
    school_name: 'Mifthahul Uloom Higher Secondary Madrassa',
    school_tagline: 'Nurturing Islamic Excellence, Moral Integrity & Academic Eminence',
    school_arabic_name: 'مدرسة مفتاح العلوم الثانوية العليا',
    hero_title: 'Mifthahul Uloom Higher Secondary Madrassa',
    hero_subtitle: 'A premier center of authentic Islamic knowledge integrated with high-caliber modern higher secondary education, shaping pious, visionary leaders for tomorrow.',
    about_history: 'Established in 1982, Mifthahul Uloom Higher Secondary Madrassa has stood as a beacon of Islamic learning, intellectual rigor, and spiritual refinement. Over four decades, the institution has blossomed from a humble Quran study circle into a premier Higher Secondary Madrassa campus serving thousands of students across Kerala and beyond.',
    about_vision: 'To cultivate a generation of intellectually enlightened, spiritually steadfast Muslim scholars, professionals, and citizens who harmoniously balance divine guidance with contemporary academic excellence.',
    about_mission: 'Providing holistic Islamic education rooted in authentic Ahlus Sunnah Wal Jama’ah scholarship alongside comprehensive state-of-the-art secondary and higher secondary schooling, in an inspiring environment of moral character and modern technology.',
    principal_name: 'Usthad Abdul Rahman Faizy',
    principal_title: 'Principal & Head of Institution',
    principal_message: 'In the name of Allah, Most Gracious, Most Merciful. Welcome to Mifthahul Uloom. Our sacred responsibility is not merely to impart curricula, but to sculpt hearts and minds according to the noble prophetic tradition. By seamlessly integrating timeless Quranic wisdom with modern higher secondary schooling and cutting-edge digital management, we equip our boys and girls with both the compass of faith and the tools of worldly mastery.',
    contact_address: 'Mifthahul Uloom Campus, Madrassa Road, Kuttichira, Kozhikode, Kerala 673001',
    contact_phone: '+91 495 272 8840 / +91 98470 11223',
    contact_email: 'office@mifthahululoom.edu.in',
    contact_working_hours: 'Monday – Saturday: 7:30 AM – 5:00 PM (Friday Half Day)'
  };

  for (const [k, v] of Object.entries(settingsData)) {
    await db.execute({
      sql: 'INSERT INTO website_settings (key, value) VALUES (?, ?)',
      args: [k, v]
    });
  }

  // 15. Initial Audit Logs
  await db.execute({
    sql: 'INSERT INTO audit_logs (user_id, username, user_role, action, module, target_id, previous_value, new_value, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [1, 'admin', 'SUPER_ADMIN', 'SYSTEM_INITIALIZATION', 'System', '0', null, 'Initial database schema and demo records initialized', '127.0.0.1']
  });

  console.log('Database seeded with complete realistic records successfully!');
}

seedData().catch(console.error);
