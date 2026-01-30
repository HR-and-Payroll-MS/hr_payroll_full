import { NavLink, Outlet } from 'react-router-dom';

export const DirectoryList = ({ data, onItemClick }) => {
  const sample = [1, 2, 3, 4, 5, 6, 7, 8];
  console.log('DirectoryList data:', data);
  const BASE_URL = import.meta.env.VITE_BASE_URL || '';
  const pagination = (
    <div id="middle" className="flex flex-1 justify-between  items-start ">
      <div className="flex items-center  gap-1.5">
        <div className="py-1.5 px-1 border-gray-100 shadow-2xl border h-full">
          <img className="h-3" src="\svg\left-chevron-svgrepo-com.svg" alt="" />
        </div>
        <p className="font-semibold py-1 px-2 border-gray-100 shadow-2xl border text-gray-500  text-xs">
          1
        </p>
        <p className="font-semibold py-1 px-2 border-gray-100 shadow-2xl border text-gray-500  text-xs items-center">
          ...
        </p>
        <p className="font-semibold py-1 px-2 border-gray-100 shadow-2xl border text-gray-700  text-xs">
          2
        </p>
        <div className="py-1.5 px-1 border-gray-100 shadow-2xl border h-full">
          <img
            className="h-3 rotate-180"
            src="\svg\left-chevron-svgrepo-com.svg"
            alt=""
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <p className="font-semibold text-gray-500  text-xs">
          Showing 1 to 8 of 8 entries
        </p>
        <div className="flex items-center py-1.5 px-2 border border-gray-100 rounded">
          <p className="font-semibold text-gray-700  text-xs">Show 8</p>
          <img
            className="h-4 rotate-180"
            src="\svg\down-arrow-5-svgrepo-com.svg"
            alt=""
          />
        </div>
      </div>
    </div>
  );
  const items = data && data.length ? data : sample;
  const buildPhoto = (p) => {
    if (!p) return '/pic/download (48).png';
    let s = String(p);
    // replace backslashes with forward slashes
    s = s.replace(/\\/g, '/').replace(/\\/g, '/').replace(/\//g, '/');
    // ensure it starts with http or leading slash
    if (!s.startsWith('http') && !s.startsWith('/')) s = '/' + s;
    return s;
  };
  const List = (
    <div
      id="left"
      className="grid grid-cols-1 h-full overflow-y-auto hover-bar sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 py-2.5"
    >
      {items.map((item, i) => {
        const person = typeof item === 'object' ? item : {};
        const rawPhoto =
          person?.general?.photo ||
          person?.general?.general_photo ||
          person?.general?.profilepicture ||
          '';
        const photo = rawPhoto
          ? rawPhoto.startsWith('http')
            ? rawPhoto
            : rawPhoto.startsWith('/')
              ? rawPhoto
              : `${BASE_URL}${rawPhoto}`
          : '';
        const name =
          person?.general?.fullname ||
          person?.general?.general_fullname ||
          'Unknown';
        const role = person?.job?.employeeid || person?.job?.role || '—';
        const email =
          person?.general?.emailaddress ||
          person?.general?.general_emailaddress ||
          '';
        const phone =
          person?.general?.phonenumber ||
          person?.general?.general_phonenumber ||
          '';
        const id = person?.id || person?.pk || person?.user_id || i;

        const status =
          person?.employeestatus ||
          person?.employment?.employeestatus ||
          person?.job?.employeestatus ||
          person?.payroll?.employeestatus ||
          person?.general?.employeestatus ||
          'active';
        const statusKey = String(status).toLowerCase();
        const statusColor = statusKey.includes('prob')
          ? '#F59E0B'
          : statusKey.includes('term')
            ? '#EF4444'
            : statusKey.includes('inactive')
              ? '#6B7280'
              : statusKey.includes('leave') || statusKey.includes('onleave')
                ? '#3B82F6'
                : '#10B981';
        const statusLabel = (String(status) || 'Active')
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

        return (
          <div
            key={i}
            className="relative h-fit shadow rounded-xl bg-gray-50 dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 dark:bg-slate-700 overflow-visible w-full"
          >
            {/* Fancy zigzag status badge (SVG) placed top-left */}
            <div className="absolute top-0 left-0 -translate-x-3 -translate-y-1 z-20 pointer-events-none">
              <svg
                width="120"
                height="26"
                viewBox="0 0 120 36"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <polygon
                  points="0,0 92,0 104,18 92,36 0,36 12,18"
                  fill={statusColor}
                />
                <text
                  x="32"
                  y="22"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="700"
                  style={{ fontFamily: 'Inter, ui-sans-serif, system-ui' }}
                >
                  {statusLabel}
                </text>
              </svg>
            </div>
            <div
              onClick={() => onItemClick && onItemClick(id)}
              className="cursor-pointer w-full"
            >
              <div className="flex  w-full flex-col h-full p-2 px-4 gap-2 items-center">
                {photo ? (
                  <>
                    <img
                      className="w-20 m-4 h-20 object-fill rounded-full"
                      src={photo}
                      alt={name}
                      onError={(e) => {
                        try {
                          const currentSrc = e.target.getAttribute('src') || '';
                          if (
                            currentSrc &&
                            !currentSrc.startsWith('http') &&
                            !currentSrc.startsWith('data:') &&
                            BASE_URL
                          ) {
                            e.target.onerror = null;
                            const fixed = currentSrc.startsWith('/')
                              ? `${BASE_URL}${currentSrc}`
                              : `${BASE_URL}/${currentSrc}`;
                            e.target.src = fixed;
                            return;
                          }
                        } catch (err) {
                          // fall through
                        }
                        e.target.style.display = 'none';
                        const fallback = e.target.nextSibling;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div
                      style={{ display: 'none' }}
                      className="rounded-full bg-slate-800 relative text-slate-100 h-20 w-20 text-center flex items-center justify-center font-bold text-base"
                    >
                      {(name || '')
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('') || 'NA'}
                    </div>
                  </>
                ) : (
                  <div className="rounded-full bg-slate-800 text-slate-100 h-20 w-20 text-center flex items-center justify-center font-bold text-base">
                    {(name || '')
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('') || 'NA'}
                  </div>
                )}
                <p className="font-bold text-gray-700 dark:text-white text-lg">
                  {name}
                </p>
                <p className="font-semibold text-gray-500 dark:text-slate-200 text-xs">
                  {role}
                </p>
              </div>
              <hr className="text-gray-200 dark:text-slate-800 h-3" />
              <div
                id="middle"
                className="items-center flex flex-col flex-1 w-full"
              >
                <div className="flex items-start gap-2 justify-start p-2 rounded ">
                  <img
                    className="h-4 opacity-50"
                    src="\svg\down-arrow-5-svgrepo-com.svg"
                    alt=""
                  />
                  <p className="font-semibold text-xs text-gray-700 dark:text-white break-words whitespace-normal">
                    {email}
                  </p>
                </div>
                <div className="flex items-start gap-2 justify-start p-2 rounded ">
                  <img
                    className="h-4 opacity-50"
                    src="\svg\development-marketing-outline-svgrepo-com.svg"
                    alt=""
                  />
                  <p className="font-semibold text-xs pb-6 text-gray-700 dark:text-white break-words whitespace-normal">
                    {phone}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
  const Header = (
    <div
      id="left"
      className="flex py-2.5 flex-2 gap-3  justify-between items-center  "
    >
      <div className="flex flex-1 flex-col text-gray-700 items-start  justify-start  rounded-md">
        <p className="text-xl font-bold">Directory</p>
        <p className="text-xs text-gray-500 font-semibold">
          This is Director board
        </p>
      </div>
      {/* <div className="flex bg-slate-800 text-white items-center  justify-center gap-1.5 px-5 py-3 rounded-md">
                    <img className="h-4" src="\svg\clock.svg" alt="" />
                    <p className="text-xs font-semibold">Check in 00h 00m 05s</p>
            </div> */}
    </div>
  );

  const DirectoryList = <>{List}</>;
  return <>{DirectoryList}</>;
};
