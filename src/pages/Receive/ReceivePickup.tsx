import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import DataGrid from "../../components/tms/table/DataGrid";
import DatePicker from "../../components/tms/form/DatePicker";
import SearchableSelect from "../../components/tms/form/SearchableSelect";
import Select from "../../components/tms/form/Select";
import AxiosInstance from "../../services/apiClient";
import { formatThaiDateTime, toThaiDate } from "../../utils/dateTime";

type PickupType = "CUSTOMER" | "SHIPPER";

type PickupReceiveRow = {
  source_type: "WEB" | "IMPORT";
  receive_id: number;
  receive_code?: string | null;
  reference_no?: string | null;
  receive_date?: string | null;
  delivery_date?: string | null;
  customer_name?: string | null;
  shipper_name?: string | null;
  shipper_tel?: string | null;
  to_warehouse_name?: string | null;
  pickup_type?: PickupType | null;
  pickup_name?: string | null;
  pickup_address?: string | null;
  pickup_tel?: string | null;
  pickup_route_id?: number | null;
  pickup_route_code?: string | null;
  pickup_route_name?: string | null;
  pickup_route_count?: number | string | null;
  remark?: string | null;
  pickup_subdistrict_name?: string | null;
  pickup_district_name?: string | null;
  pickup_province_name?: string | null;
  assigned_warehouse_name?: string | null;
  total_serial?: number | string | null;
  pickup_status?: string | null;
  pickup_driver_name?: string | null;
  pickup_truck_code?: string | null;
};

type PickupSerialRow = {
  serial_id: number;
  serial_no?: string | null;
  package_name?: string | null;
  package_detail_name?: string | null;
  weight?: number | string | null;
  width?: number | string | null;
  length?: number | string | null;
  height?: number | string | null;
  q?: number | string | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const emptyPagination: Pagination = { page: 1, limit: 100, total: 0, totalPages: 1 };
const emptyFilters = { search: "", date_from: "", date_to: "", customer_id: "", pickup_type: "" };
type Customer = { id: number; code?: string; name: string };

const text = (value: unknown) => (value === null || value === undefined || value === "" ? "-" : String(value));

const number = (value: unknown) => (value === null || value === undefined || value === "" ? "-" : Number(value).toLocaleString("th-TH"));

const pickupTypeText = (value: PickupType | null | undefined) => {
  if (value === "CUSTOMER") return "เจ้าของงาน";
  if (value === "SHIPPER") return "ผู้ส่ง";
  return "-";
};

const pickupStatusText = (value: unknown) => {
  if (value === undefined) return "-";
  if (value === null || value === "") return "รอรับงาน";
  if (value === "ACCEPTED") return "รับงานแล้ว";
  return String(value);
};

export default function ReceivePickup() {
  const [rows, setRows] = useState<PickupReceiveRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>(emptyPagination);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [serialTarget, setSerialTarget] = useState<PickupReceiveRow | null>(null);
  const [serialRows, setSerialRows] = useState<PickupSerialRow[]>([]);
  const [serialLoading, setSerialLoading] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalSerial, setTotalSerial] = useState(0);

  const fetchPickupReceives = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await AxiosInstance.get<{ data?: PickupReceiveRow[]; pagination?: Pagination; summary?: { total_serial: number } }>(
        "/pickup",
        {
          params: { page, limit, ...appliedFilters },
        },
      );

      setRows(Array.isArray(response.data?.data) ? response.data.data : []);
      setPagination(response.data?.pagination || { ...emptyPagination, page, limit });
      setTotalSerial(response.data?.summary?.total_serial ?? 0);
    } catch (requestError) {
      console.error("fetch pickup receives error:", requestError);
      setRows([]);
      setPagination({ ...emptyPagination, page, limit });
      setTotalSerial(0);
      setError("ไม่สามารถโหลดรายการรถเข้ารับพัสดุได้");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, limit, page]);

  useEffect(() => {
    void AxiosInstance.get<Customer[]>("/customers")
      .then(({ data }) => { if (Array.isArray(data)) setCustomers(data); })
      .catch(() => setCustomers([]));
  }, []);

  useEffect(() => {
    void fetchPickupReceives();
  }, [fetchPickupReceives]);

  useEffect(() => {
    if (!serialTarget) return;

    let active = true;

    const fetchSerials = async () => {
      try {
        setSerialLoading(true);
        const response = await AxiosInstance.get<{ data?: PickupSerialRow[] }>(
          `/pickup/${serialTarget.source_type}/${serialTarget.receive_id}/serials`,
        );
        if (active) setSerialRows(Array.isArray(response.data?.data) ? response.data.data : []);
      } catch (requestError) {
        console.error("fetch pickup receive serials error:", requestError);
        if (active) setSerialRows([]);
      } finally {
        if (active) setSerialLoading(false);
      }
    };

    void fetchSerials();

    return () => {
      active = false;
    };
  }, [serialTarget]);

  const gridRows = useMemo(
    () =>
      rows.map((row, index) => ({
        ...row,
        row_number: (page - 1) * limit + index + 1,
        _grid_id: `${row.source_type}-${row.receive_id}`,
      })),
    [limit, page, rows],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: "row_number", headerName: "#", width: 60, minWidth: 60, align: "center", headerAlign: "center" },
      {
        field: "receive_code",
        headerName: "เลขที่บิล",
        width: 220,
        minWidth: 190,
        renderCell: ({ row }) => (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setSerialTarget(row as PickupReceiveRow);
            }}
            className="font-semibold text-blue-700 hover:text-blue-900 hover:underline"
            title="กดเพื่อดูรายการ SN"
          >
            {text(row.receive_code)}
          </button>
        ),
      },
      { field: "reference_no", headerName: "REFERENCE", width: 180, minWidth: 160, valueGetter: (value) => text(value) },
      { field: "pickup_status", headerName: "สถานะงาน", width: 150, valueGetter: (value) => pickupStatusText(value) },
      { field: "pickup_driver_name", headerName: "คนขับ", width: 180, valueGetter: (value) => text(value) },
      { field: "pickup_truck_code", headerName: "ใบปิดบรรทุก", width: 180, valueGetter: (value) => text(value) },
      {
        field: "receive_date",
        headerName: "วันที่สร้าง",
        width: 165,
        minWidth: 155,
        valueGetter: (value) => formatThaiDateTime(value),
      },
      {
        field: "delivery_date",
        headerName: "วันที่ส่ง",
        width: 140,
        minWidth: 130,
        valueGetter: (value) => toThaiDate(value ? String(value).slice(0, 10) : ""),
      },
      { field: "pickup_type", headerName: "รับสินค้าจาก", width: 135, minWidth: 125, valueGetter: (value) => pickupTypeText(value) },
      { field: "pickup_name", headerName: "จุดรับสินค้า", width: 220, minWidth: 190, valueGetter: (value) => text(value) },
      { field: "pickup_address", headerName: "ที่อยู่จุดรับ", width: 220, minWidth: 190, valueGetter: (value) => text(value) },
      { field: "pickup_tel", headerName: "เบอร์โทร", width: 130, minWidth: 120, valueGetter: (value) => text(value) },
      { field: "pickup_subdistrict_name", headerName: "ตำบล", width: 135, minWidth: 120, valueGetter: (value) => text(value) },
      { field: "pickup_district_name", headerName: "อำเภอ", width: 135, minWidth: 120, valueGetter: (value) => text(value) },
      { field: "pickup_province_name", headerName: "จังหวัด", width: 145, minWidth: 130, valueGetter: (value) => text(value) },
      {
        field: "pickup_route_id",
        headerName: "สายรถเข้ารับ",
        width: 220,
        minWidth: 180,
        valueGetter: (_value, row) =>
          Number(row.pickup_route_count) > 1
            ? "หลายสาย"
            : [row.pickup_route_code, row.pickup_route_name].filter(Boolean).join(" - ") || "-",
      },
      { field: "assigned_warehouse_name", headerName: "รับมาเข้าคลัง", width: 180, minWidth: 160, valueGetter: (value) => text(value) },
      { field: "to_warehouse_name", headerName: "คลังปลายทาง", width: 180, minWidth: 160, valueGetter: (value) => text(value) },
      {
        field: "total_serial",
        headerName: "SN",
        width: 90,
        minWidth: 80,
        align: "right",
        headerAlign: "right",
        valueGetter: (value) => number(value),
      },
      { field: "remark", headerName: "เงื่อนไขการเข้ารับ / จัดส่ง", width: 220, minWidth: 180, valueGetter: (value) => text(value) },
    ],
    [],
  );

  const serialColumns = useMemo<GridColDef<PickupSerialRow>[]>(
    () => [
      { field: "serial_no", headerName: "SN", flex: 1.5, minWidth: 240, valueGetter: (value) => text(value) },
      { field: "package_name", headerName: "แพ็กเกจ", width: 180, valueGetter: (value) => text(value) },
      { field: "package_detail_name", headerName: "รายละเอียด", width: 180, valueGetter: (value) => text(value) },
      { field: "q", headerName: "ปริมาตร", width: 90, align: "center", headerAlign: "center", valueGetter: (value) => number(value) },
      { field: "weight", headerName: "น้ำหนัก", width: 70, align: "center", headerAlign: "center", valueGetter: (value) => number(value) },
      { field: "width", headerName: "กว้าง", width: 70, align: "center", headerAlign: "center", valueGetter: (value) => number(value) },
      { field: "length", headerName: "ยาว", width: 70, align: "center", headerAlign: "center", valueGetter: (value) => number(value) },
      { field: "height", headerName: "สูง", width: 70, align: "center", headerAlign: "center", valueGetter: (value) => number(value) },
    ],
    [],
  );

  const handlePaginationChange = (model: GridPaginationModel) => {
    if (model.pageSize !== limit) {
      setLimit(model.pageSize);
      setPage(1);
      return;
    }

    setPage(model.page + 1);
  };

  return (
    <div className="flex h-[calc(100vh-61px)] w-full flex-col overflow-hidden bg-slate-50 px-1 py-2 text-slate-800">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-semibold text-slate-900">รายการรถเข้ารับพัสดุ</h1>
          <p className="mt-0.5 text-xs text-slate-500">บิลที่ระบุให้ไปรับสินค้าจากเจ้าของงานหรือผู้ส่ง</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 text-xs text-blue-700">
            บิล <span className="font-semibold">{loading ? "..." : number(pagination.total)}</span>
          </span>
          <span className="inline-flex h-8 items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 text-xs text-emerald-700">
            SN <span className="font-semibold text-emerald-800">{loading ? "..." : number(totalSerial)}</span>
          </span>
          <button
            type="button"
            onClick={() => void fetchPickupReceives()}
            disabled={loading}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            รีเฟรช
          </button>
        </div>
      </div>

      <form
        className="mb-3 shrink-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setAppliedFilters({ ...filters });
        }}
      >
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-[minmax(160px,1.2fr)_150px_150px_minmax(160px,1fr)_160px_auto] xl:items-end">
          <label className="block text-xs font-medium text-slate-600">
            ค้นหา
            <input
              className="mt-1 h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              placeholder="ค้นหา เลขที่บิล / SN / Reference"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            วันที่สร้าง
            <span className="mt-1 block">
              <DatePicker variant="compact" value={filters.date_from} onChange={(value) => setFilters({ ...filters, date_from: value })} />
            </span>
          </label>
          <label className="block text-xs font-medium text-slate-600">
            ถึงวันที่
            <span className="mt-1 block">
              <DatePicker variant="compact" value={filters.date_to} onChange={(value) => setFilters({ ...filters, date_to: value })} />
            </span>
          </label>
          <div className="text-xs font-medium text-slate-600">
            เจ้าของงาน
            <SearchableSelect
              className="mt-1"
              compact
              portal
              value={filters.customer_id}
              onChange={(value) => setFilters({ ...filters, customer_id: value })}
              options={[
                { value: "", label: "เจ้าของงานทั้งหมด" },
                ...customers.map((customer) => ({
                  value: String(customer.id),
                  label: customer.code ? `${customer.code} - ${customer.name}` : customer.name,
                })),
              ]}
            />
          </div>
          <div className="text-xs font-medium text-slate-600">
            รับสินค้าจาก
            <Select
              className="!mt-1 !h-9 !rounded-md"
              value={filters.pickup_type}
              onChange={(value) => setFilters({ ...filters, pickup_type: value })}
              options={[
                { value: "", label: "ทั้งหมด" },
                { value: "CUSTOMER", label: "เจ้าของงาน" },
                { value: "SHIPPER", label: "ผู้ส่ง" },
              ]}
            />
          </div>
          <button type="submit" className="h-9 rounded-md bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700">
            ค้นหา
          </button>
        </div>
      </form>

      <div className="min-h-0 flex-1 overflow-hidden">
        {error ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm text-rose-700">
            {error}
          </div>
        ) : (
          <DataGrid
            rows={gridRows}
            columns={columns}
            loading={loading}
            getRowId={(row: { _grid_id: string }) => row._grid_id}
            height="100%"
            pageSize={limit}
            paginationMode="server"
            rowCount={pagination.total}
            paginationModel={{ page: page - 1, pageSize: limit }}
            onPaginationModelChange={handlePaginationChange}
            striped
            rowHoverColor="#dbeafe"
          />
        )}
      </div>

      {serialTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
          <div className="animate-scaleIn motion-reduce:animate-none flex h-[min(78vh,680px)] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">รายการ SN ในบิล</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {text(serialTarget.receive_code)} · {pickupTypeText(serialTarget.pickup_type)}: {text(serialTarget.pickup_name)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSerialTarget(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="ปิด"
              >
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 p-4">
              <DataGrid
                rows={serialRows}
                columns={serialColumns}
                loading={serialLoading}
                getRowId={(row) => row.serial_id}
                height="100%"
                pageSize={50}
                striped
                rowHoverColor="#dbeafe"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
