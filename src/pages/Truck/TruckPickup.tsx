import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderOpen,
  // Eye,
  RefreshCcw,
  X,
} from "lucide-react";
import type { GridColDef } from "@mui/x-data-grid";
import DataGrid from "../../components/tms/table/DataGrid";
import DatePicker from "../../components/tms/form/DatePicker";
import Select from "../../components/tms/form/Select";
import AxiosInstance from "../../services/apiClient";
import { formatThaiDateTime } from "../../utils/dateTime";

type PickupTruck = {
  truck_load_id: number;
  truck_code: string | null;
  receive_code: string | null;
  create_date: string | null;
  close_datetime: string | null;
  driver_name: string | null;
  driver_type: string | null;
  license_plate: string | null;
  license_plate_province: string | null;
  route_code: string | null;
  route_name: string | null;
  is_close: string | null;
  is_go: string | null;
  is_completed: string | null;
};

type Media = { file_path: string };
const display = (value: string | null | undefined) => value || "-";
const truckStatus = (truck: PickupTruck) =>
  truck.is_completed === "Y" ? "รับลงคลังแล้ว" : truck.is_close === "Y" && truck.is_go === "Y" ? "ปิดบรรทุกแล้ว" : "รอปิดบรรทุก";

export default function TruckPickup() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<PickupTruck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<PickupTruck | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await AxiosInstance.get<{ data?: PickupTruck[] }>("/pickup-trucks");
      setRows(Array.isArray(data.data) ? data.data : []);
    } catch {
      setError("ไม่สามารถโหลดรายการใบรถเข้ารับได้");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    setMedia([]);
    setMediaError("");
    setMediaLoading(true);
    AxiosInstance.get<{ data?: Media[] }>(`/pickup-trucks/${selected.truck_load_id}/media`)
      .then(({ data }) => {
        if (active) setMedia(Array.isArray(data.data) ? data.data : []);
      })
      .catch(() => {
        if (active) setMediaError("ไม่สามารถโหลดรูปปิดบรรทุกได้");
      })
      .finally(() => {
        if (active) setMediaLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selected]);
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return rows.filter((row) => {
      const match = [row.truck_code, row.receive_code, row.driver_name, row.license_plate].some((value) =>
        (value || "").toLowerCase().includes(keyword),
      );
      const date = row.create_date ? row.create_date.slice(0, 10) : "";
      return match && (!dateFrom || date >= dateFrom) && (!dateTo || (!!date && date <= dateTo)) && (!status || truckStatus(row) === status);
    });
  }, [rows, search, dateFrom, dateTo, status]);
  const columns = useMemo<GridColDef<PickupTruck>[]>(
    () => [
      {
        field: "row_number",
        headerName: "#",
        width: 56,
        sortable: false,
        filterable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
      },
      {
        field: "create_date",
        headerName: "วันที่",
        width: 155,
        renderCell: ({ value }) => <div className="flex h-full items-center">{formatThaiDateTime(value)}</div>,
      },
      {
        field: "truck_code",
        headerName: "เลขที่ใบรถเข้ารับ",
        width: 190,
        renderCell: ({ value }) => <div className="flex h-full items-center font-semibold text-blue-700">{display(value)}</div>,
      },
      {
        field: "receive_code",
        headerName: "เลขที่บิล",
        width: 210,
        renderCell: ({ value }) => <div className="flex h-full items-center">{display(value)}</div>,
      },
      {
        field: "route_name",
        headerName: "สายรถ",
        width: 190,
        renderCell: ({ row }) => (
          <div className="flex h-full items-center truncate">{[row.route_code, row.route_name].filter(Boolean).join(" - ") || "-"}</div>
        ),
      },
      // {
      //   field: "is_close",
      //   headerName: "สถานะ",
      //   width: 150,
      //   align: "center",
      //   headerAlign: "center",
      //   renderCell: ({ row }) => (
      //     <div className="flex h-full w-full items-center justify-center">
      //       <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{truckStatus(row)}</span>
      //     </div>
      //   ),
      // },
      {
        field: "driver_type",
        headerName: "ประเภทรถ",
        width: 130,
        align: "center",
        headerAlign: "center",
        renderCell: ({ value }) => (
          <div className="flex h-full w-full items-center justify-center text-sm font-medium text-slate-700">
            {value === "EMPLOYEE" ? "รถปกติ" : value === "CONTRACTOR" ? "รถเสริม" : "-"}
          </div>
        ),
      },
      {
        field: "driver_name",
        headerName: "คนขับ / ทะเบียนรถ",
        width: 220,
        renderCell: ({ row }) => (
          <div className="flex h-full w-full flex-col justify-center leading-5">
            <span className="truncate font-medium text-slate-800">{display(row.driver_name)}</span>
            <span className="truncate text-xs text-slate-500">
              {[row.license_plate, row.license_plate_province].filter(Boolean).join(" ") || "-"}
            </span>
          </div>
        ),
      },
      {
        field: "actions",
        headerName: "จัดการ",
        width: 115,
        sortable: false,
        filterable: false,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <div className="flex h-full w-full items-center justify-center gap-1.5">
            <button type="button" title="เข้าสู่ใบปิดบรรทุก" aria-label="เข้าสู่ใบปิดบรรทุก"
              onClick={() => navigate(`/pickup-trucks/${row.truck_load_id}`)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100">
              <FolderOpen size={16} />
            </button>
          </div>
        ),
      },
      // {
      //   field: "actions",
      //   headerName: "รายละเอียด",
      //   width: 115,
      //   sortable: false,
      //   filterable: false,
      //   align: "center",
      //   headerAlign: "center",
      //   renderCell: ({ row }) => (
      //     <div className="flex h-full w-full items-center justify-center">
      //       <button
      //         type="button"
      //         title="ดูรายละเอียด"
      //         onClick={() => setSelected(row)}
      //         className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
      //       >
      //         <Eye size={16} />
      //       </button>
      //     </div>
      //   ),
      // },
    ],
    [navigate],
  );
  const fileUrl = (filePath: string) => `${String(AxiosInstance.defaults.baseURL || "").replace(/\/$/, "")}/${filePath.replace(/^\/+/, "")}`;
  return (
    <div className="flex h-[calc(100vh-61px)] w-full flex-col overflow-hidden bg-slate-50 px-1 py-2 text-slate-800">
      <section className="mb-3 shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-800">ใบรถเข้ารับสินค้า</h1>
            <p className="mt-0.5 text-xs text-slate-500">ตรวจสอบรายการใบรถเข้ารับสินค้า</p>
          </div>
        </div>
      </section>
      <section className="mb-3 shrink-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_.75fr_.75fr_.75fr_auto]">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">ค้นหาเลขที่ใบรถ</label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ค้นหาเลขที่ใบรถ เลขบิล คนขับ หรือทะเบียนรถ"
              className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">วันที่เริ่มต้น</label>
            <DatePicker variant="compact" value={dateFrom} onChange={setDateFrom} placeholder="เลือกวันที่เริ่มต้น" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">วันที่สิ้นสุด</label>
            <DatePicker variant="compact" value={dateTo} onChange={setDateTo} placeholder="เลือกวันที่สิ้นสุด" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">สถานะใบรถ</label>
            <Select
              className="!h-9"
              value={status}
              onChange={setStatus}
              options={[
                { value: "", label: "ทั้งหมด" },
                { value: "รอปิดบรรทุก", label: "รอปิดบรรทุก" },
                { value: "ปิดบรรทุกแล้ว", label: "ปิดบรรทุกแล้ว" },
                { value: "รับลงคลังแล้ว", label: "รับลงคลังแล้ว" },
              ]}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="h-9 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              ค้นหา
            </button>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-1.5">
                <RefreshCcw size={14} />
                รีเฟรช
              </span>
            </button>
          </div>
        </div>
      </section>
      {error && (
        <div role="alert" className="mb-3 shrink-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="min-h-0 flex-1 overflow-hidden">
          <DataGrid
            rows={filtered}
            columns={columns}
            getRowId={(row: PickupTruck) => row.truck_load_id}
            loading={loading}
            framed={false}
            height="100%"
            pageSize={100}
          />
        </div>
      </section>
      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pickup-truck-title"
        >
          <div className="animate-scaleIn motion-reduce:animate-none max-h-[85vh] w-full max-w-xl overflow-auto rounded-xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <h2 id="pickup-truck-title" className="text-base font-bold">
                รายละเอียดใบรถเข้ารับ
              </h2>
              <button type="button" onClick={() => setSelected(null)} aria-label="ปิด" className="rounded-md p-1 text-slate-500 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">เลขใบรถ</dt>
                <dd>{display(selected.truck_code)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">เลขบิล</dt>
                <dd>{display(selected.receive_code)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">คนขับ</dt>
                <dd>{display(selected.driver_name)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">ทะเบียนรถ</dt>
                <dd>{[selected.license_plate, selected.license_plate_province].filter(Boolean).join(" ") || "-"}</dd>
              </div>

              <div>
                <dt className="text-slate-500">เวลาปิดบรรทุก</dt>
                <dd>{formatThaiDateTime(selected.close_datetime)}</dd>
              </div>
            </dl>
            <h3 className="mt-5 text-sm font-bold">รูปปิดบรรทุก</h3>
            {mediaLoading ? (
              <p className="mt-2 text-sm text-slate-500">กำลังโหลดรูป...</p>
            ) : mediaError ? (
              <p role="alert" className="mt-2 text-sm text-red-600">
                {mediaError}
              </p>
            ) : media.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {media.map((item) => (
                  <a key={item.file_path} href={fileUrl(item.file_path)} target="_blank" rel="noreferrer">
                    <img src={fileUrl(item.file_path)} alt="รูปปิดบรรทุก" className="h-32 max-w-full rounded-lg object-cover" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">ไม่มีรูปปิดบรรทุก</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
