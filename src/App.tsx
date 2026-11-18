import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "sonner";
import { ScrollToTop } from "./components/common/ScrollToTop";
import AppRoutes from "./routes/AppRoutes";
import "react-datepicker/dist/react-datepicker.css";

export default function App() {
  return (
    <Router>
      <Toaster position="top-center" richColors closeButton toastOptions={{ className: "font-thai" }} />
      <ScrollToTop />
      <AppRoutes />
    </Router>
  );
}
