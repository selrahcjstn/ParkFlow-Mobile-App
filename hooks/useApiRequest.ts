import { useCallback, useEffect, useState } from "react";

type AsyncRequest<TArgs extends unknown[], TResult> = (
  ...args: TArgs
) => Promise<TResult>;

export function useApiRequest<TArgs extends unknown[], TResult>(
  request: AsyncRequest<TArgs, TResult>,
) {
  const [data, setData] = useState<TResult | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);

  const run = useCallback(
    async (...args: TArgs) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await request(...args);
        setData(result);
        return result;
      } catch (requestError) {
        setError(requestError);
        throw requestError;
      } finally {
        setIsLoading(false);
      }
    },
    [request],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    error,
    isLoading,
    run,
    reset,
  };
}

export function useApiMutation<TArgs extends unknown[], TResult>(
  mutation: AsyncRequest<TArgs, TResult>,
) {
  return useApiRequest(mutation);
}

export function useApiQuery<TResult>(
  request: () => Promise<TResult>,
  enabled = true,
) {
  const requestState = useApiRequest(request);
  const { run } = requestState;

  useEffect(() => {
    if (!enabled) return;

    void run();
  }, [enabled, run]);

  return requestState;
}
