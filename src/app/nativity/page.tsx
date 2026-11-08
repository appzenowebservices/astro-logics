"use client";

import React from "react";
import Layout from "../components/Layout";
import NativityChart from "../components/tabs/NativityChart";

export default function NativityArchivePage() {
  return (
    <Layout>
      <div className="h-[calc(100vh-9rem)] min-h-[620px] overflow-hidden rounded-2xl">
        <NativityChart />
      </div>
    </Layout>
  );
}
