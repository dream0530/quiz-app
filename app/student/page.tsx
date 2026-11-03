import Link from "next/link";
import StudentApp from "@/components/StudentApp";
import { isStoreConfigured } from "@/lib/firebase/admin";
import type { StudentPaper } from "@/lib/quiz/types";
import { listStudentPapers } from "@/lib/store/papers";

// 교사가 공개한 문제지를 열 때마다 새로 읽는다(정답·해설은 빼고 보낸다).
export const dynamic = "force-dynamic";

export default async function StudentPage() {
  let papers: StudentPaper[] | null = null;
  if (isStoreConfigured()) {
    try {
      papers = await listStudentPapers();
    } catch (error) {
      console.error("공개 문제지 읽기 실패", error);
    }
  }

  if (papers === null) {
    return (
      <section className="card">
        <h1>학생으로 시작하기</h1>
        <p className="error">문제지 목록을 불러오지 못했습니다.</p>
        <p className="hint">잠시 후 새로고침해 주세요. 계속 안 되면 선생님께 알려 주세요.</p>
        <div className="actions">
          <Link className="button" href="/">
            첫 화면으로
          </Link>
        </div>
      </section>
    );
  }

  return <StudentApp papers={papers} />;
}
