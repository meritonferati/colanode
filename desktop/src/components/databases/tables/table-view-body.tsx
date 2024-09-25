import React from 'react';
import { useDatabase } from '@/contexts/database';
import { TableViewRow } from '@/components/databases/tables/table-view-row';
import { TableViewEmptyPlaceholder } from '@/components/databases/tables/table-view-empty-placeholder';
import { TableViewLoadMoreRow } from './table-view-load-more-row';
import { useRecordsQuery } from '@/queries/use-records-query';
import { useViewSearch } from '@/contexts/view-search';

export const TableViewBody = () => {
  const database = useDatabase();
  const viewSearch = useViewSearch();

  const { data, isPending, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useRecordsQuery(database.id, viewSearch.filters, viewSearch.sorts);

  const records = data ?? [];
  return (
    <div className="border-t">
      {records.length === 0 && <TableViewEmptyPlaceholder />}
      {records.map((record, index) => (
        <TableViewRow key={record.id} index={index} record={record} />
      ))}
      {!isPending && hasNextPage && (
        <TableViewLoadMoreRow
          isPending={isFetchingNextPage}
          onClick={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
        />
      )}
    </div>
  );
};
