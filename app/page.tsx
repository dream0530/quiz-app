import Link from "next/link";

// 첫 화면: 교사와 학생 중 하나를 골라 각자의 화면(주소)으로 들어간다.
export default function Home() {
  return (
    <section className="card">
      <h1>문제풀이</h1>
      <p>어떻게 시작할지 골라 주세요.</p>

      <div className="roles">
        <Link className="role" href="/teacher">
          <span className="role-title">교사로 시작하기</span>
          <span className="role-desc">문제를 등록하고 학생들의 풀이 결과를 봅니다.</span>
        </Link>
        <Link className="role" href="/student">
          <span className="role-title">학생으로 시작하기</span>
          <span className="role-desc">이름을 입력하고 문제를 풉니다.</span>
        </Link>
      </div>
    </section>
  );
}
