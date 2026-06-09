export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React, { Suspense } from 'react';
import RegistryFilters from '@/components/RegistryFilters';
import RegistryTable from '@/components/RegistryTable';
import { getCaseRegistry, getFilterOptions } from '@/lib/services/registry';

// Next.js 15+ search params signature
interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RegistryPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page) : 1;
  const searchTerm = typeof resolvedParams.search === 'string' ? resolvedParams.search : '';
  const caseType = typeof resolvedParams.caseType === 'string' ? resolvedParams.caseType : 'all';
  const status = typeof resolvedParams.status === 'string' ? resolvedParams.status : 'all';
  const commissioner = typeof resolvedParams.commissioner === 'string' ? resolvedParams.commissioner : 'all';
  const legalOfficer = typeof resolvedParams.legalOfficer === 'string' ? resolvedParams.legalOfficer : 'all';
  const year = typeof resolvedParams.year === 'string' ? resolvedParams.year : 'all';
  const nearDeadline = resolvedParams.nearDeadline === 'true';
  const overdue = resolvedParams.overdue === 'true';
  const sortBy = typeof resolvedParams.sortBy === 'string' ? resolvedParams.sortBy : 'receivedDate';
  const sortOrder = typeof resolvedParams.sortOrder === 'string' ? (resolvedParams.sortOrder as 'asc' | 'desc') : 'desc';

  // Fetch data
  const [{ data, metadata }, filterOptions] = await Promise.all([
    getCaseRegistry({
      page,
      pageSize: 10,
      searchTerm,
      caseType,
      status,
      commissioner,
      legalOfficer,
      year,
      nearDeadline,
      overdue,
      sortBy,
      sortOrder,
    }),
    getFilterOptions()
  ]);

  return (
    <div className="space-y-6 max-w-full">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-thai">สารบบคดี (Case Registry)</h1>
        <p className="mt-1 text-sm text-slate-500">
          ทะเบียนคุมเรื่องร้องทุกข์และอุทธรณ์ พร้อมระบบติดตามระยะเวลา
        </p>
      </div>

      <Suspense fallback={<div className="h-24 bg-slate-100 rounded-xl animate-pulse"></div>}>
        <RegistryFilters
          initialSearchTerm={searchTerm}
          caseType={caseType}
          status={status}
          commissioner={commissioner}
          legalOfficer={legalOfficer}
          year={year}
          nearDeadline={nearDeadline}
          overdue={overdue}
          commissionerOptions={filterOptions.commissioners}
          legalOfficerOptions={filterOptions.legalOfficers}
        />
      </Suspense>

      <Suspense fallback={<div className="h-64 bg-slate-100 rounded-xl animate-pulse"></div>}>
        <RegistryTable data={data} metadata={metadata} />
      </Suspense>
    </div>
  );
}

