import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmModal from "../../components/tms/modal/ConfirmModal";
import AxiosInstance from "../../services/apiClient";

type Truck = { truck_code: string | null; driver_name: string | null; warehouse_name: string | null; license_plate: string | null; license_province: string | null; route_code: string | null; route_name: string | null; is_close: string | null; is_go: string | null };
type Item = { serial_id: string | number; serial_no: string; customer_name: string | null; to_warehouse_name: string | null };

export default function TruckPickupScan() {
  const { truckId } = useParams();
  const navigate = useNavigate();
  const [truck, setTruck] = useState<Truck | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [pending, setPending] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    AxiosInstance.get<{ data: Truck; items: Item[]; pending: Item[] }>(`/pickup-trucks/${encodeURIComponent(truckId || "")}`)
      .then(({ data }) => { if (active) { setTruck(data.data); setItems(data.items); setPending(data.pending); setError(""); } })
      .catch(() => { if (active) setError("ไม่สามารถโหลดรายละเอียดใบรถเข้ารับได้"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [truckId]);

  const deleteTruck = async () => {
    setDeleting(true);
    setError("");
    try {
      await AxiosInstance.patch(`/pickup-trucks/${encodeURIComponent(truckId || "")}/delete`);
      navigate("/pickup-trucks");
    } catch (requestError: any) {
      setConfirmOpen(false);
      setError(requestError?.response?.data?.message || "ไม่สามารถลบใบรถเข้ารับได้");
    } finally {
      setDeleting(false);
    }
  };

  const closed = truck?.is_close === "Y" || truck?.is_go === "Y";
  return (
    <div className="flex h-[calc(100vh-61px)] w-full flex-col overflow-hidden bg-slate-50 px-1 py-2 text-slate-800">
      <header className="mb-3 flex shrink-0 items-end justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={() => navigate("/pickup-trucks")} title="กลับรายการใบรถเข้ารับ" aria-label="กลับรายการใบรถเข้ารับ" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"><ArrowLeft size={17} /></button>
          <div><h1 className="text-lg font-bold text-slate-900">ขนของขึ้นรถเข้ารับ</h1><p className="mt-0.5 text-xs text-slate-500">ตรวจสอบรายการสินค้าตามใบปิดบรรทุกที่เลือกไว้</p></div>
        </div>
        <button type="button" onClick={() => setConfirmOpen(true)} disabled={loading || deleting || !truck || closed || items.length > 0} title={items.length ? "นำสินค้าออกจากรถให้หมดก่อนจึงจะลบใบรถได้" : closed ? "ใบรถปิดบรรทุกแล้ว" : undefined} className="h-9 shrink-0 rounded-md border border-red-300 bg-red-100 px-2.5 text-sm text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400">ลบใบปิดบรรทุก</button>
      </header>
      {error && <p role="alert" className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <section className="mb-3 shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 xl:items-end">
          {[{ label: "คลังปัจจุบัน", value: truck?.warehouse_name || "-" }, { label: "คนขับ", value: truck?.driver_name || "-" }, { label: "รถ", value: [truck?.license_plate, truck?.license_province].filter(Boolean).join(" - ") || "-" }, { label: "สายรถเข้ารับ", value: [truck?.route_code, truck?.route_name].filter(Boolean).join(" - ") || "-" }].map((field) => (
            <div key={field.label} className="min-w-0"><label className="mb-1 block text-xs font-medium text-slate-600">{field.label}</label><div className="h-9 truncate rounded-md border border-slate-300 bg-slate-100 px-2.5 text-sm leading-9 text-slate-700">{field.value}</div></div>
          ))}
        </div>
        <div className="mt-2.5 grid gap-x-4 gap-y-2 border-t border-slate-100 pt-2.5 lg:grid-cols-2">
          <div><label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="pickup-load">ยิงขึ้นรถ</label><input id="pickup-load" disabled placeholder="ยิง SN เพื่อย้ายไปฝั่งขวา" className="h-9 w-full rounded-md border border-slate-300 bg-slate-100 px-3 font-mono text-sm" /></div>
          <div><label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="pickup-remove">ยิงลบรายการ</label><input id="pickup-remove" disabled placeholder="ยิง SN ฝั่งขวาเพื่อส่งกลับฝั่งซ้าย" className="h-9 w-full rounded-md border border-slate-200 bg-slate-100 px-3 font-mono text-sm" /></div>
        </div>
      </section>
      {closed && (
        <div className="mb-3 shrink-0 rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
          ปิดบรรทุกแล้ว ไม่สามารถยิงเพิ่มหรือนำรายการออกได้
        </div>
      )}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-2">
        <SerialTable title="รายการรอยิงขึ้นรถ" rows={pending} loading={loading} scanned={false} />
        <SerialTable title="รายการที่ยิงขึ้นรถแล้ว" rows={items} loading={loading} scanned />
      </div>
      <ConfirmModal open={confirmOpen} title="ยืนยันลบใบปิดบรรทุก" description={`ต้องการลบใบรถ ${truck?.truck_code || "นี้"} และยกเลิกงานเข้ารับใช่หรือไม่`} cancelLabel="ไม่" confirmLabel="ใช่" loadingLabel="กำลังลบ..." loading={deleting} danger closeOnBackdrop={false} closeOnEscape={false} onClose={() => setConfirmOpen(false)} onConfirm={() => void deleteTruck()} />
    </div>
  );
}

function SerialTable({ title, rows, loading, scanned }: { title: string; rows: Item[]; loading: boolean; scanned: boolean }) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2.5">
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${scanned ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{rows.length.toLocaleString("th-TH")} รายการ</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full table-fixed border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-slate-100 text-slate-600"><tr><th className="w-[45%] border-b border-slate-200 px-3 py-2 text-left">SN</th><th className="w-[35%] border-b border-slate-200 px-3 py-2 text-left">เจ้าของงาน</th><th className="w-[20%] border-b border-slate-200 px-3 py-2 text-right">คลังปลายทาง</th></tr></thead>
          <tbody>
            {loading || !rows.length ? (
              <tr><td colSpan={3} className="px-3 py-10 text-center text-sm text-slate-500">{loading ? "กำลังโหลดรายการ..." : scanned ? "ยังไม่มีรายการที่ยิงขึ้นรถ" : "ไม่มีรายการรอยิงขึ้นรถ"}</td></tr>
            ) : rows.map((row, index) => (
              <tr key={`${row.serial_id}-${row.serial_no}-${index}`} className={`${index % 2 ? "bg-slate-50/70" : "bg-white"} ${scanned ? "hover:bg-emerald-50/50" : "hover:bg-blue-50/50"}`}>
                <td title={row.serial_no} className="border-b border-slate-100 px-3 py-2">
                  <span className={`inline-flex max-w-full rounded-lg border px-2.5 py-1 font-mono text-sm font-semibold ${scanned ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-600"}`}><span className="truncate">{row.serial_no}</span></span>
                </td>
                <td title={row.customer_name || "-"} className="truncate border-b border-slate-100 px-3 py-2">{row.customer_name || "-"}</td>
                <td title={row.to_warehouse_name || "-"} className="truncate border-b border-slate-100 px-3 py-2 text-right">{row.to_warehouse_name || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
