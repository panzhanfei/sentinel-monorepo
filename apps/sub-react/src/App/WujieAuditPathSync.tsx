import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AUDIT_REACT_HOST_SYNC_EVENT,
  REACT_SUB_NAVIGATE_EVENT,
} from "@/constants";

/** 宿主 Next `/audit/**` ↔ 子应用 react-router（保活 + sync=false 时依赖此桥） */
export const WujieAuditPathSync = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locRef = useRef(location.pathname);

  useEffect(() => {
    locRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    const bus = window.$wujie?.bus;
    if (!bus) return;

    const onHostNavigate = (path: unknown) => {
      const p = typeof path === "string" ? path : "/";
      if (p === locRef.current) return;
      navigate(p);
    };

    bus.$on(REACT_SUB_NAVIGATE_EVENT, onHostNavigate);
    return () => {
      bus.$off(REACT_SUB_NAVIGATE_EVENT, onHostNavigate);
    };
  }, [navigate]);

  useEffect(() => {
    const bus = window.$wujie?.bus;
    if (!bus) return;
    bus.$emit(AUDIT_REACT_HOST_SYNC_EVENT, { path: location.pathname });
  }, [location.pathname]);

  return null;
};
