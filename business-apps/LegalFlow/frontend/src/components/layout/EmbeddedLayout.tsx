import { Outlet } from 'react-router-dom';

/**
 * Minimal layout for iframe-embedded mode.
 * The GAS portal provides all navigation chrome (sidebar, header).
 * LegalFlow's own sidebar, top bar, and footer are hidden.
 */
export default function EmbeddedLayout() {
    return (
        <main className="p-4 lg:p-6">
            <Outlet />
        </main>
    );
}
