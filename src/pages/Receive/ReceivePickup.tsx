import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import DataGrid from "../../components/tms/table/DataGrid";
import AxiosInstance from "../../services/apiClient";
import { formatThaiDateTime, toThaiDate } from "../../utils/dateTime";

type PickupType = "CUSTOMER" | "SHIPPER";

type PickupReceiveRow = {
  source_type: "WEB" | "IMPORT";
  receive_id: number;
  receive_code?: string | null;
  receive_date?: string | null;
  delivery_date?: string | null;
  customer_name?: string | null;
  shipper_name?: string | null;
  shipper_tel?: string | null;
  to_warehouse_name?: string | null;
  pickup_type?: PickupType | null;
  pickup_name?: string | null;
  pickup_subdistrict_name?: string | null;
  pickup_district_name?: string | null;
  pickup_province_name?: string | null;
  assigned_warehouse_name?: string | null;
  total_serial?: number | string | null;
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

const emptyPagination: Pagination = { page: 1, limit: 50, total: 0, totalPages: 1 };

const text = (value: unknown) => (value === null || value === undefined || value === "" ? "-" : String(value));

const number = (value: unknown) => (value === null || value === undefined || value === "" ? "-" : Number(value).toLocaleString("th-TH"));

const pickupTypeText = (value: PickupType | null | undefined) => {
  if (value === "CUSTOMER") return "เจ้าของงาน";
  if (value === "SHIPPER") return "ผู้ส่ง";
  return "-";
};

export default function ReceivePickup() {
  const [rows, setRows] = useState<PickupReceiveRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>(emptyPagination);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [serialTarget, setSerialTarget] = useState<PickupReceiveRow | null>(null);
  const [serialRows, setSerialRows] = useState<PickupSerialRow[]>([]);
  const [serialLoading, setSerialLoading] = useState(false);

  const fetchPickupReceives = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await AxiosInstance.get<{ data?: PickupReceiveRow[]; pagination?: Pagination }>("/pickup", {
        params: { page, limit },
      });

      setRows(Array.isArray(response.data?.data) ? response.data.data : []);
      setPagination(response.data?.pagination || { ...emptyPagination, page, limit });
    } catch (requestError) {
      console.error("fetch pickup receives error:", requestError);
      setRows([]);
      setPagination({ ...emptyPagination, page, limit });
      setError("ไม่สามารถโหลดรายการรถเข้ารับพัสดุได้");
    } finally {
      setLoading(false);
    }
  }, [limit, page]);

  useEffect(() => {
    void fetchPickupReceives();
  }, [fetchPickupReceives]);

  useEffect(() => {
    if (!serialTarget) return;

    let active = true;

    const fetchSerials = async () => {
      try {
        setSerialLoading(true);
        const response = await AxiosInstance.get<{ data?: PickupSerialRow[] }>(`/pickup/${serialTarget.source_type}/${serialTarget.receive_id}/serials`);
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
      { field: "shipper_tel", headerName: "เบอร์โทร", width: 130, minWidth: 120, valueGetter: (value) => text(value) },
      { field: "pickup_subdistrict_name", headerName: "ตำบล", width: 135, minWidth: 120, valueGetter: (value) => text(value) },
      { field: "pickup_district_name", headerName: "อำเภอ", width: 135, minWidth: 120, valueGetter: (value) => text(value) },
      { field: "pickup_province_name", headerName: "จังหวัด", width: 145, minWidth: 130, valueGetter: (value) => text(value) },
      { field: "assigned_warehouse_name", headerName: "คลังรับเข้า", width: 180, minWidth: 160, valueGetter: (value) => text(value) },
      { field: "to_warehouse_name", headerName: "คลังปลายทาง", width: 180, minWidth: 160, valueGetter: (value) => text(value) },
      { field: "total_serial", headerName: "SN", width: 90, minWidth: 80, align: "right", headerAlign: "right", valueGetter: (value) => number(value) },
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

      <div className="min-h-0 flex-1 overflow-hidden">
        {error ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm text-rose-700">{error}</div>
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
          <div className="flex h-[min(78vh,680px)] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
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
