import React from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ExportToolbar() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative group">
        <Button variant="outline" className="opacity-50 cursor-not-allowed">
          <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
        </Button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max bg-foreground text-background text-xs px-2 py-1 rounded shadow-lg">
          Coming Soon: Excel export will be available in a future update.
        </div>
      </div>
      <div className="relative group">
        <Button variant="outline" className="opacity-50 cursor-not-allowed">
          <FileText className="w-4 h-4 mr-2" /> PDF
        </Button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max bg-foreground text-background text-xs px-2 py-1 rounded shadow-lg">
          Coming Soon: PDF export will be available in a future update.
        </div>
      </div>
    </div>
  );
}
