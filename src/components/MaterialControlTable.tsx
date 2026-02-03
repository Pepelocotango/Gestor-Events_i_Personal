import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MaterialControlRow } from '../types';
import { ChevronDownIcon, ChevronRightIcon } from '../constants';
import { formatDateRangeDMY } from '../utils/dateFormat';
import Tooltip from './ui/Tooltip';

interface MaterialControlTableProps {
  data: MaterialControlRow[];
}

const MaterialControlTable: React.FC<MaterialControlTableProps> = ({ data }) => {
  const { t } = useTranslation();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (itemId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  if (data.length === 0) {
    return <div className="text-center p-8 text-muted-foreground bg-card rounded-lg border border-border">{t('mcc.no_results')}</div>;
  }

  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted">
          <tr>
            <th scope="col" className="w-8 px-1 py-3"></th>
            <th scope="col" className="px-2 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Tooltip text={t('mcc.tooltip_stock')}>
                <span>{t('mcc.header_stock')}</span>
              </Tooltip>
            </th>
            <th scope="col" className="px-2 pl-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Tooltip text={t('mcc.tooltip_name')}>
                <span>{t('mcc.header_name')}</span>
              </Tooltip>
            </th>
            <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Tooltip text={t('mcc.tooltip_category')}>
                <span>{t('mcc.header_category')}</span>
              </Tooltip>
            </th>
            <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Tooltip text={t('mcc.tooltip_origin')}>
                <span>{t('mcc.header_origin')}</span>
              </Tooltip>
            </th>
            <th scope="col" className="px-2 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Tooltip text={t('mcc.tooltip_demanded')}>
                <span>{t('mcc.header_demanded')}</span>
              </Tooltip>
            </th>
            <th scope="col" className="px-2 pr-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Tooltip text={t('mcc.tooltip_balance')}>
                <span>{t('mcc.header_balance')}</span>
              </Tooltip>
            </th>
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {data.map(row => {
            const isExpanded = expandedRows.has(row.item.id);
            const balanceIsNegative = row.balance < 0;
            const hasBreakdown = row.breakdown.length > 0;

            return (
              <React.Fragment key={row.item.id}>
                <tr className={`hover:bg-accent ${balanceIsNegative ? 'bg-destructive/10' : ''}`}>
                  <td className="px-1 py-3 text-center">
                    {hasBreakdown && (
                      <button onClick={() => toggleRow(row.item.id)} className="p-1 rounded-full hover:bg-secondary">
                        {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
                      </button>
                    )}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-right text-sm font-medium">{row.item.stock}</td>
                  <td className="px-2 pl-4 py-3 whitespace-normal">
                    <div className="font-medium text-foreground">{row.item.name}</div>
                    {row.item.notes && <div className="text-xs text-muted-foreground">{row.item.notes}</div>}
                  </td>
                  <td className="px-2 py-3 whitespace-normal text-sm text-muted-foreground">{row.item.category}</td>
                  <td className="px-2 py-3 whitespace-normal text-sm text-muted-foreground">{row.item.location}</td>
                  <td className="px-2 py-3 whitespace-nowrap text-right text-sm font-medium">{row.totalDemand}</td>
                  <td className={`px-2 pr-4 py-3 whitespace-nowrap text-right text-sm font-bold ${balanceIsNegative ? 'text-destructive' : 'text-success'}`}>
                    {row.balance}
                  </td>
                </tr>
                {isExpanded && hasBreakdown && (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <div className="p-4 bg-muted/50">
                        <h4 className="font-semibold text-sm mb-2">{t('mcc.breakdown_title')}</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {row.breakdown.map(bd => (
                            <li key={bd.eventFrameId} className="text-sm text-muted-foreground">
                              <span className="font-medium">{bd.eventName} ({formatDateRangeDMY(bd.startDate, bd.endDate)}):</span>
                              <span className="ml-2">{bd.quantity} {t('mcc.units_suffix')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MaterialControlTable;
