import Link from "next/link";
import TeacherLogin from "@/components/TeacherLogin";
import TeacherLogout from "@/components/TeacherLogout";
import { loadQuestionPapers } from "@/lib/quiz/papers";
import { getSignedInTeacher } from "@/lib/teacher/server";

// 교사 화면. 들어올 때마다 서버에서 로그인 상태와 허용된 교사 계정인지 확인하고,
// 아니면 교사 화면 내용 대신 로그인 화면만 보낸다. 문제 등록·결과 저장은 다음 단계에서 연결한다.
// 문제지는 제목과 문항 수만 넘겨, 정답이 이 화면 데이터에 들어가지 않게 한다.
export default async function TeacherPage() {
  const teacher = await getSignedInTeacher();

  if (!teacher.ok && teacher.reason === "not-configured") {
    return (
      <section className="card">
        <h1>교사 로그인</h1>
        <p className="error">교사 로그인 설정이 아직 끝나지 않았습니다.</p>
        <p className="hint">Firebase 설정값과 교사 이메일을 .env.local 파일에 넣은 뒤 앱을 다시 켜 주세요.</p>
        <div className="actions">
          <Link className="button" href="/">
            첫 화면으로
          </Link>
        </div>
      </section>
    );
  }

  if (!teacher.ok) {
    return <TeacherLogin />;
  }

  const papers = loadQuestionPapers().map((paper) => ({
    id: paper.id,
    title: paper.title,
    count: paper.questions.length,
  }));

  return (
    <section className="card">
      <h1>교사 화면</h1>
      <p className="hint">{teacher.email} 계정으로 로그인했습니다.</p>

      <div className="panel">
        <h2>문제 등록</h2>
        <p className="hint">문제를 등록하는 기능은 다음 단계에서 연결됩니다.</p>
        <p>지금 학생들이 풀 수 있는 문제지</p>
        {papers.length > 0 ? (
          <ul className="papers">
            {papers.map((paper) => (
              <li key={paper.id} className="paper static">
                <span className="paper-title">{paper.title}</span>
                <span className="paper-count">{paper.count}문항</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="hint">아직 준비된 문제지가 없습니다.</p>
        )}
      </div>

      <div className="panel">
        <h2>학생 풀이 결과</h2>
        <p className="hint">
          학생들의 풀이 결과를 모아 보는 기능은 다음 단계에서 연결됩니다. 지금은 결과가 저장되지
          않습니다.
        </p>
      </div>

      <div className="actions">
        <Link className="button" href="/">
          첫 화면으로
        </Link>
        <TeacherLogout />
      </div>
    </section>
  );
}
