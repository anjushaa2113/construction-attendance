import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Reads ?tab=xxx&leaveId=yyy (or correctionId=yyy) from the URL on mount.
 * - Calls setTab(tab) to switch to the right tab
 * - Calls setHighlightId(id) so the page can highlight that specific record
 * - Clears the params from the URL so they don't persist on refresh
 *
 * Usage in LeaveRequestPage:
 *   const [highlightId, setHighlightId] = useState(null);
 *   useTabFromUrl(setTab, setHighlightId, 'leaveId');
 *
 * Usage in AttendanceCorrectionPage:
 *   const [highlightId, setHighlightId] = useState(null);
 *   useTabFromUrl(setTab, setHighlightId, 'correctionId');
 */
export function useTabFromUrl(setTab, setHighlightId, recordParamKey) {
    const [searchParams, setSearchParams] = useSearchParams();
    const handled = useRef(false);

    useEffect(() => {
        if (handled.current) return;
        handled.current = true;

        const tab      = searchParams.get('tab');
        const recordId = recordParamKey ? searchParams.get(recordParamKey) : null;

        if (tab)      setTab(tab);
        if (recordId) setHighlightId(recordId);

        // Clean URL after reading
        if (tab || recordId) {
            setTimeout(() => setSearchParams({}, { replace: true }), 0);
        }
    }, []); // run once on mount only
}