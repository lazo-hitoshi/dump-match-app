import { PageHeader } from "@/components/layout/page-header";
import { updateCompanyStatus } from "@/lib/actions/companies";
import { createClient } from "@/lib/supabase/server";
import { companyStatusLabel, companyTypeLabel } from "@/lib/format";
import { getCurrentUserProfile } from "@/lib/auth/session";
import { isAdminRole } from "@/types/domain";
import { redirect } from "next/navigation";
import type { CompanyStatus } from "@/types/database";

type CompanyRow = {
  id: string;
  company_code: string;
  company_type: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: CompanyStatus;
  review_note: string | null;
};

export default async function CompaniesPage() {
  const profile = await getCurrentUserProfile();
  if (!profile || !isAdminRole(profile.role)) redirect("/dashboard");

  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("id, company_code, company_type, name, email, phone, address, status, review_note")
    .order("created_at", { ascending: false });

  const companies = (data ?? []) as CompanyRow[];

  return (
    <>
      <PageHeader eyebrow="管理者" title="会社審査" />
      <section className="panel admin-panel">
        <div className="section-heading">
          <h3>登録会社一覧</h3>
          <span className="count-pill">{companies.length}社</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>コード</th>
                <th>会社名</th>
                <th>種別</th>
                <th>連絡先</th>
                <th>状態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td>{company.company_code}</td>
                  <td>
                    <strong>{company.name}</strong>
                    <div className="mini-text">{company.address}</div>
                  </td>
                  <td>{companyTypeLabel(company.company_type)}</td>
                  <td>
                    {company.email}
                    <div className="mini-text">{company.phone}</div>
                  </td>
                  <td>
                    <span className={`status-pill ${company.status === "pending" ? "warning" : "open"}`}>
                      {companyStatusLabel(company.status)}
                    </span>
                  </td>
                  <td>
                    <div className="card-actions">
                      {company.status !== "approved" ? (
                        <form action={updateCompanyStatus}>
                          <input type="hidden" name="id" value={company.id} />
                          <input type="hidden" name="status" value="approved" />
                          <button type="submit" className="small-button primary">
                            承認
                          </button>
                        </form>
                      ) : null}
                      {company.status !== "rejected" ? (
                        <form action={updateCompanyStatus}>
                          <input type="hidden" name="id" value={company.id} />
                          <input type="hidden" name="status" value="rejected" />
                          <input type="hidden" name="review_note" value="書類不備" />
                          <button type="submit" className="small-button">
                            差戻し
                          </button>
                        </form>
                      ) : null}
                      {company.status !== "suspended" ? (
                        <form action={updateCompanyStatus}>
                          <input type="hidden" name="id" value={company.id} />
                          <input type="hidden" name="status" value="suspended" />
                          <button type="submit" className="danger-button">
                            停止
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
