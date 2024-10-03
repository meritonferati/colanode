import React from 'react';
import { QueryInput, QueryMap } from '@/types/queries';
import { sha256 } from 'js-sha256';
import { useEventBus } from './use-event-bus';
import { NeuronId } from '@/lib/id';

export const useQuery = <T extends QueryInput>(input: T) => {
  const eventBus = useEventBus();

  const inputJson = JSON.stringify(input);
  const hash = sha256(inputJson);

  const [isPending, setIsPending] = React.useState(true);
  const [data, setData] = React.useState<
    QueryMap[T['type']]['output'] | undefined
  >(undefined);

  React.useEffect(() => {
    const queryId = NeuronId.generate(NeuronId.Type.Query);
    const fetchData = async () => {
      try {
        const result = await window.neuron.executeQuery(queryId, input);
        setData(result);
      } catch (error) {
        console.error('Error executing query:', error);
      } finally {
        setIsPending(false);
      }
    };

    fetchData();

    const subscriberId = eventBus.subscribe((event) => {
      if (
        event.event === 'query_result_updated' &&
        event.payload?.id === queryId &&
        event.payload?.result
      ) {
        setData(event.payload.result);
      }
    });

    return () => {
      window.neuron.unsubscribeQuery(queryId);
      eventBus.unsubscribe(subscriberId);
    };
  }, [hash]);

  return {
    isPending,
    data,
  };
};
