import React from "react";
import { Outlet } from "react-router-dom";
import TopNav from "@/components/TopNav";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8">
        <Outlet />
      </main>
    </div>
  );
}