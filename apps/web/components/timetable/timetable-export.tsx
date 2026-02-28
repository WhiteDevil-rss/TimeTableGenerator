'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LuDownload, LuPrinter, LuLoader } from 'react-icons/lu';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface TimetableExportProps {
    targetId: string;
    filename: string;
}

export const TimetableExport: React.FC<TimetableExportProps> = ({ targetId, filename }) => {
    const [isExporting, setIsExporting] = useState(false);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPdf = async () => {
        setIsExporting(true);
        try {
            const element = document.getElementById(targetId);
            if (!element) throw new Error('Target element not found');

            // Temporarily modify styles for better render quality
            const originalStyle = element.style.cssText;
            element.style.padding = '20px';
            element.style.background = 'white';

            const canvas = await html2canvas(element, {
                scale: 2, // Higher resolution
                useCORS: true,
                logging: false,
            });

            // Revert styles
            element.style.cssText = originalStyle;

            const imgData = canvas.toDataURL('image/png');

            // A4 Landscape dimensions in mm
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4',
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${filename}.pdf`);
        } catch (error) {
            console.error('Failed to generate PDF', error);
            alert('Failed to construct PDF. Please use the Print function as an alternative.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex items-center gap-3 print:hidden">
            <Button
                variant="outline"
                className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 h-9"
                onClick={handlePrint}
            >
                <LuPrinter className="w-4 h-4 mr-2" />
                Print
            </Button>
            <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-9"
                onClick={handleDownloadPdf}
                disabled={isExporting}
            >
                {isExporting ? <LuLoader className="w-4 h-4 mr-2 animate-spin" /> : <LuDownload className="w-4 h-4 mr-2" />}
                {isExporting ? 'Generating PDF...' : 'Download PDF'}
            </Button>
        </div>
    );
};
