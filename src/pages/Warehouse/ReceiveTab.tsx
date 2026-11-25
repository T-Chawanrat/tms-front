import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import WarehouseReceive from "./WarehouseReceive";
import DcReceive from "./DcReceive";
import PickupReceive from "./PickupReceive";

export default function ReceiveTab() {
  const { pathname, search } = useLocation();
  const { permissions } = useAuth();
  const canReceiveWarehouse = permissions.includes("WAREHOUSE_RECEIVE");
  const canReceiveDc = permissions.includes("DC_RECEIVE");
  const canReceivePickup = permissions.includes("PICKUP_RECEIVE");
  const requested = new URLSearchParams(search).get("tab");
  const active = requested === "pickup" && canReceivePickup ? "pickup"
    : requested === "dc" && canReceiveDc ? "dc"
    : requested === "warehouse" && canReceiveWarehouse ? "warehouse"
    : pathname === "/wh-receive" && canReceiveWarehouse ? "warehouse"
    : canReceiveWarehouse ? "warehouse" : canReceiveDc ? "dc" : "pickup";

  const tabs = [
    { id: "warehouse", label: "รับเข้าจากบิล", path: "/dc-receive?tab=warehouse", visible: canReceiveWarehouse },
    { id: "dc", label: "รับจากรถขนย้าย", path: "/dc-receive?tab=dc", visible: canReceiveDc },
    { id: "pickup", label: "รับจากรถเข้ารับ", path: "/dc-receive?tab=pickup", visible: canReceivePickup },
  ];

  return (
    <div className="flex h-[calc(100vh-61px)] min-h-0 flex-col bg-slate-50">
      <nav aria-label="ประเภทรายการรับเข้าคลัง" className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2">
        {tabs.filter((tab) => tab.visible).map((tab) => (
          <Link
            key={tab.id}
            to={tab.path}
            aria-current={active === tab.id ? "page" : undefined}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${active === tab.id ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <div className="min-h-0 flex-1">
        {!canReceiveWarehouse && !canReceiveDc && !canReceivePickup && (
          <p className="p-6 text-sm text-slate-600">คุณไม่มีสิทธิ์รับสินค้าเข้าคลัง</p>
        )}
        {active === "warehouse" && canReceiveWarehouse && <WarehouseReceive embedded />}
        {active === "dc" && canReceiveDc && <DcReceive embedded />}
        {active === "pickup" && canReceivePickup && <PickupReceive embedded />}
      </div>
    </div>
  );
}
