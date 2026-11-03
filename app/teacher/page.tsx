import Link from "next/link";
import PublishToggle from "@/components/PublishToggle";
import TeacherLogin from "@/components/TeacherLogin";
import TeacherLogout from "@/components/TeacherLogout";
import TeacherUpload from "@/components/TeacherUpload";
import { isStoreConfigured } from "@/lib/firebase/admin";
import { averageScore } from "@/lib/quiz/paper-tools";
import { listTeacherPapers, type TeacherPaper } from "@/lib/store/papers";
import { listResultsByPaper, type StudentResult } from "@/lib/store/results";
import { getSignedInTeacher } from "@/lib/teacher/server";

// 교사 화면. 들어올 때마다 서버에서 로그인 상태와 허용된 교사 계정인지 확인하고,
// 아니면 교사 화면 내용(문제지·학생 결과) 대신 로그인 화면만 보낸다.
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

  let papers: TeacherPaper[] | null = null;
  let results = new Map<string, StudentResult[]>();
  if (isStoreConfigured()) {
    try {
      [papers, results] = await Promise.all([listTeacherPapers(), listResultsByPaper()]);
    } catch (error) {
      console.error("교사 화면 데이터 읽기 실패", error);
    }
  }

  return (
    <section className="card">
      <h1>교사 화면</h1>
      <p className="hint">{teacher.email} 계정으로 로그인했습니다.</p>

      {papers === null ? (
        <div className="panel">
          <p className="error">저장소(Firestore)에 연결하지 못했습니다.</p>
          <p className="hint">서버용 키 설정을 확인한 뒤 앱을 다시 켜 주세요.</p>
        </div>
      ) : (
        <>
          <div className="panel">
            <h2>문제지 등록</h2>
            <TeacherUpload />
          </div>

          <div className="panel">
            <h2>등록한 문제지와 학생 결과</h2>
            {papers.length === 0 && <p className="hint">아직 등록한 문제지가 없습니다.</p>}
            {papers.map((paper) => (
              <PaperResults key={paper.id} paper={paper} results={results.get(paper.id) ?? []} />
            ))}
          </div>
        </>
      )}

      <div className="actions">
        <Link className="button" href="/">
          첫 화면으로
        </Link>
        <TeacherLogout />
      </div>
    </section>
  );
}

const timeFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

// 문제지 하나: 공개 상태와 학생 결과표, 평균(학생 이름별 최신 결과 기준).
function PaperResults({ paper, results }: { paper: TeacherPaper; results: StudentResult[] }) {
  const average = averageScore(results.map((r) => r.score));
  return (
    <article className="paper-block">
      <div className="paper-head">
        <div>
          <h3>{paper.title}</h3>
          <p className="hint">
            {paper.questionCount}문항 · {paper.published ? "공개 중" : "비공개"}
          </p>
        </div>
        <PublishToggle id={paper.id} published={paper.published} />
      </div>

      {results.length === 0 ? (
        <p className="hint">아직 제출한 학생이 없습니다.</p>
      ) : (
        <>
          <p className="average">
            평균 <strong>{average}</strong>점 <span>(학생 {results.length}명)</span>
          </p>
          <div className="table-wrap">
            <table className="results-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>점수</th>
                  <th>틀린 문제</th>
                  <th>제출 시각</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.studentName}>
                    <td>{r.studentName}</td>
                    <td>{r.score}점</td>
                    <td>{r.wrongQuestions.length === 0 ? "없음" : `${r.wrongQuestions.join(", ")}번`}</td>
                    <td>{timeFormat.format(r.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </article>
  );
}
