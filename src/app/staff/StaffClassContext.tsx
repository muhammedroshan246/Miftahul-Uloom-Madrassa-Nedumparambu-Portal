'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AssignedClass {
  classId: number;
  className: string;
}

interface StaffClassContextType {
  assignedClasses: AssignedClass[];
  selectedClassId: number | null;
  selectedClass: AssignedClass | null;
  setSelectedClassId: (id: number) => void;
  loading: boolean;
  user: any;
  teacher: any;
}

const StaffClassContext = createContext<StaffClassContextType>({
  assignedClasses: [],
  selectedClassId: null,
  selectedClass: null,
  setSelectedClassId: () => {},
  loading: true,
  user: null,
  teacher: null,
});

export function StaffClassProvider({ children }: { children: React.ReactNode }) {
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([]);
  const [selectedClassId, setSelectedClassIdState] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [teacher, setTeacher] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAuthAndClasses() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          if (isMounted) setLoading(false);
          return;
        }
        const data = await res.json();
        if (!isMounted) return;

        setUser(data.user);
        const tData = data.teacher || data.details?.teacher;
        setTeacher(tData);

        let list: AssignedClass[] = [];
        if (tData?.assignedClassesList && Array.isArray(tData.assignedClassesList)) {
          const map = new Map<number, AssignedClass>();
          for (const item of tData.assignedClassesList) {
            if (item.classId && !map.has(item.classId)) {
              map.set(item.classId, {
                classId: Number(item.classId),
                className: String(item.className || ('Class ' + item.classId))
              });
            }
          }
          list = Array.from(map.values());
        }

        // Sadr special: In staff mode, assigned class is +2 (id 36)
        if (list.length === 0 && (data.user?.role === 'SADR' || data.user?.username === 'sadr' || data.user?.username === 'jabir.baqavi')) {
          list = [{ classId: 36, className: '+2' }];
        }

        setAssignedClasses(list);

        // Check localStorage or URL query for initial active class
        let initialId: number | null = null;
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const qClassId = urlParams.get('classId');
          if (qClassId && list.some(c => c.classId === Number(qClassId))) {
            initialId = Number(qClassId);
          } else {
            const savedId = localStorage.getItem('staff_selected_class_id');
            if (savedId && list.some(c => c.classId === Number(savedId))) {
              initialId = Number(savedId);
            }
          }
        }

        if (initialId) {
          setSelectedClassIdState(initialId);
        } else if (list.length > 0) {
          setSelectedClassIdState(list[0].classId);
        }
      } catch (err) {
        console.error('Failed to load staff classes:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAuthAndClasses();

    return () => {
      isMounted = false;
    };
  }, []);

  const setSelectedClassId = (id: number) => {
    setSelectedClassIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('staff_selected_class_id', String(id));
      window.dispatchEvent(new CustomEvent('staff_class_selected', { detail: { classId: id } }));
    }
  };

  const selectedClass = assignedClasses.find(c => c.classId === selectedClassId) || (assignedClasses[0] || null);

  return (
    <StaffClassContext.Provider
      value={{
        assignedClasses,
        selectedClassId,
        selectedClass,
        setSelectedClassId,
        loading,
        user,
        teacher
      }}
    >
      {children}
    </StaffClassContext.Provider>
  );
}

export function useStaffClass() {
  return useContext(StaffClassContext);
}
