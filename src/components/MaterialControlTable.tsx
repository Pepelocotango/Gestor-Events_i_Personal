import React, { useState } from 'react';
import { MaterialControlRow } from '../types';
import { ChevronDownIcon, ChevronRightIcon } from '../constants';
import { formatDateRangeDMY } from '../utils/dateFormat';
import Tooltip from './ui/Tooltip';

interface MaterialControlTableProps {
  data: MaterialControlRow[];
}

const MaterialControlTable: React.FC<MaterialControlTableProps> = ({ data }) => {
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
    return <div className="text-center p-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg shadow">No s'han trobat resultats amb els filtres aplicats.</div>;
  }

  return (
    <div className="overflow-x-auto shadow rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" className="w-12 px-4 py-3"></th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              <Tooltip text="Quantitat inicial de material disponible.">
                <span>Estoc</span>
              </Tooltip>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              <Tooltip text="Nom del material">
                <span>Nom</span>
              </Tooltip>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              <Tooltip text="Categoria del material">
                <span>Categoria</span>
              </Tooltip>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              <Tooltip text="Origen o magatzem del material">
                <span>Origen</span>
              </Tooltip>
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              <Tooltip text="Quantitat total de material assignada als esdeveniments filtrats.">
                <span>Demanada</span>
              </Tooltip>
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              <Tooltip text="Balanç final del material (Estoc - Demanada).">
                <span>Balanç</span>
              </Tooltip>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map(row => {
            const isExpanded = expandedRows.has(row.item.id);
            const balanceIsNegative = row.balance < 0;
            const hasBreakdown = row.breakdown.length > 0;

            return (
              <React.Fragment key={row.item.id}>
                <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${balanceIsNegative ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                  <td className="px-4 py-3 text-center">
                    {hasBreakdown && (
                      <button onClick={() => toggleRow(row.item.id)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                        {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">{row.item.stock}</td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{row.item.name}</div>
                    {row.item.notes && <div className="text-xs text-gray-500">{row.item.notes}</div>}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{row.item.category}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{row.item.location}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">{row.totalDemand}</td>
                  <td className={`px-6 py-3 whitespace-nowrap text-right text-sm font-bold ${balanceIsNegative ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {row.balance}
                  </td>
                </tr>
                {isExpanded && hasBreakdown && (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <div className="p-4 bg-gray-100 dark:bg-gray-900/50">
                        <h4 className="font-semibold text-sm mb-2">Desglossament per Esdeveniment:</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {row.breakdown.map(bd => (
                            <li key={bd.eventFrameId} className="text-sm">
                              <span className="font-medium">{bd.eventName} ({formatDateRangeDMY(bd.startDate, bd.endDate)}):</span>
                              <span className="ml-2">{bd.quantity} unitat(s)</span>
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
