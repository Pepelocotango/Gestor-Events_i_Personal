import React, { useEffect, useState } from 'react';

interface Asset {
  name: string;
  browser_download_url: string;
  size: number;
}

interface Release {
  tag_name: string;
  assets: Asset[];
}

interface PlatformAsset {
  url: string;
  size: string;
  filename: string;
}

interface DownloadLinks {
  windows: PlatformAsset | null;
  macos: PlatformAsset | null;
  linux: PlatformAsset | null;
  android: PlatformAsset | null;
}

interface DetectedOS {
  name: 'Windows' | 'macOS' | 'Linux' | 'Android' | 'Unknown';
  type: 'windows' | 'macos' | 'linux' | 'android' | 'unknown';
}

const GithubReleases: React.FC = () => {
  const [release, setRelease] = useState<Release | null>(null);
  const [downloadLinks, setDownloadLinks] = useState<DownloadLinks>({
    windows: null,
    macos: null,
    linux: null,
    android: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [detectedOS, setDetectedOS] = useState<DetectedOS>({ name: 'Unknown', type: 'unknown' });

  // Detectar OS de l'usuari
  useEffect(() => {
    const ua = navigator.userAgent;
    let osType: DetectedOS = { name: 'Unknown', type: 'unknown' };

    if (/Windows NT/.test(ua)) {
      osType = { name: 'Windows', type: 'windows' };
    } else if (/Mac OS X|Macintosh|Darwin/.test(ua)) {
      osType = { name: 'macOS', type: 'macos' };
    } else if (/Linux|Ubuntu|Debian|Fedora|CentOS|RHEL|openSUSE/.test(ua)) {
      osType = { name: 'Linux', type: 'linux' };
    } else if (/Android/.test(ua)) {
      osType = { name: 'Android', type: 'android' };
    }

    setDetectedOS(osType);
  }, []);

  // Fetch releases de GitHub
  useEffect(() => {
    const fetchReleases = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          'https://api.github.com/repos/Pepelocotango/Gestor-Events_i_Personal/releases/latest'
        );

        if (!response.ok) {
          throw new Error('Failed to fetch releases');
        }

        const data: Release = await response.json();
        setRelease(data);

        // Procesar assets
        const links: DownloadLinks = {
          windows: null,
          macos: null,
          linux: null,
          android: null,
        };

        data.assets.forEach((asset) => {
          const filename = asset.name.toLowerCase();
          const sizeInMB = (asset.size / (1024 * 1024)).toFixed(0);

          // Windows: contains "windows" AND (.exe or .zip)
          if (filename.includes('windows') && (filename.endsWith('.exe') || filename.endsWith('.zip'))) {
            links.windows = {
              url: asset.browser_download_url,
              size: `${sizeInMB} MB`,
              filename: asset.name,
            };
          }
          // macOS: contains "macos" AND (.dmg or .zip)
          else if (filename.includes('macos') && (filename.endsWith('.dmg') || filename.endsWith('.zip'))) {
            links.macos = {
              url: asset.browser_download_url,
              size: `${sizeInMB} MB`,
              filename: asset.name,
            };
          }
          // Linux: contains "linux" AND (.appimage, .deb, .rpm, or .zip)
          else if (filename.includes('linux') && (filename.endsWith('.appimage') || filename.endsWith('.deb') || filename.endsWith('.rpm') || filename.endsWith('.zip'))) {
            // Prefer AppImage if available, otherwise use the first match
            if (filename.endsWith('.appimage') || !links.linux) {
              links.linux = {
                url: asset.browser_download_url,
                size: `${sizeInMB} MB`,
                filename: asset.name,
              };
            }
          }
          // Android: any .apk file (regardless of name)
          if (filename.endsWith('.apk')) {
            links.android = {
              url: asset.browser_download_url,
              size: `${sizeInMB} MB`,
              filename: asset.name,
            };
          }
        });

        setDownloadLinks(links);
        setError(false);
      } catch (err) {
        console.error('Error fetching releases:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, []);

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 animate-pulse">
          <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto mb-6"></div>
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-100 rounded mb-6 w-3/4"></div>
          <div className="h-12 bg-gray-200 rounded-lg mb-3"></div>
          <div className="h-3 bg-gray-100 rounded w-2/3"></div>
        </div>
      ))}
    </div>
  );

  // Error Fallback Component
  if (error || (!loading && !release)) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        <div className="md:col-span-2 lg:col-span-4 bg-yellow-50 p-6 rounded-xl border border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">No hem pogut obtenir les últimes versions</h3>
          <p className="text-yellow-700 mb-4">
            Hi ha hagut un problema consultant l'API de GitHub. Accedeix a la pàgina de versions per a descarregar.
          </p>
          <a
            href="https://github.com/Pepelocotango/Gestor-Events_i_Personal/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            Anar a GitHub Releases
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return <SkeletonLoader />;
  }

  const renderPlatformCard = (
    platformName: string,
    platformType: 'windows' | 'macos' | 'linux' | 'android',
    icon: React.ReactNode,
    bgColor: string,
    hoverBg: string,
    requirements: string,
    fallbackUrl: string
  ) => {
    const asset = downloadLinks[platformType];
    const isRecommended = detectedOS.type === platformType && platformType !== 'unknown';

    return (
      <div
        key={platformType}
        className={`group ${
          isRecommended
            ? platformType === 'android'
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 shadow-lg'
              : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-400 shadow-lg'
            : platformType === 'android'
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200'
              : 'bg-white border border-gray-100'
        } p-6 rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
      >
        <div
          className={`w-16 h-16 ${bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:${hoverBg} transition-colors`}
        >
          {icon}
        </div>

        {isRecommended && (
          <div className="mb-3">
            <span
              className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                platformType === 'android'
                  ? 'bg-green-200 text-green-800'
                  : 'bg-blue-200 text-blue-800'
              }`}
            >
              Recomanat per a tu
            </span>
          </div>
        )}

        <h3 className="text-xl font-semibold mb-2 text-gray-900">{platformName}</h3>
        <p className="text-gray-500 text-sm mb-6">{requirements}</p>

        {asset ? (
          <>
            <a
              href={asset.url}
              className={`inline-flex items-center justify-center w-full px-6 py-3 ${
                platformType === 'android'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600'
              } text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {platformType === 'android' ? 'Descarregar APK' : `Descarregar per a ${platformName}`}
            </a>
            <p className="text-xs text-gray-400 mt-3">{asset.filename} - {asset.size}</p>
          </>
        ) : (
          <>
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center w-full px-6 py-3 ${
                platformType === 'android'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600'
              } text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Veure versions
            </a>
            <p className="text-xs text-gray-400 mt-3">A GitHub Releases</p>
          </>
        )}

        {platformType === 'android' && (
          <>
            <p className="text-xs text-gray-500 mt-3 font-medium">Instal·lació manual (Sideloading)</p>
            <p className="text-xs text-gray-400">No disponible a Play Store</p>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
      {renderPlatformCard(
        'Windows',
        'windows',
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
        </svg>,
        'bg-blue-50',
        'bg-blue-100',
        'Windows 10/11 (64-bit)',
        'https://github.com/Pepelocotango/Gestor-Events_i_Personal/releases/latest'
      )}

      {renderPlatformCard(
        'macOS',
        'macos',
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6h2m7-6h8m2 0h-2M7 3h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
        </svg>,
        'bg-cyan-50',
        'bg-cyan-100',
        'macOS 10.15 o posterior',
        'https://github.com/Pepelocotango/Gestor-Events_i_Personal/releases/latest'
      )}

      {renderPlatformCard(
        'Linux',
        'linux',
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M0 0v24h24V0H0zm19.2 9.6h-6.4V6.4h6.4v3.2zM6.4 6.4v3.2H0V6.4h6.4zM0 16h6.4v-3.2H0V16zm12.8 0h6.4v-3.2h-6.4V16z" />
        </svg>,
        'bg-purple-50',
        'bg-purple-100',
        '.deb, .rpm i AppImage',
        'https://github.com/Pepelocotango/Gestor-Events_i_Personal/releases/latest'
      )}

      {renderPlatformCard(
        'Android',
        'android',
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>,
        'bg-green-100',
        'bg-green-200',
        'Android 6.0+',
        'https://github.com/Pepelocotango/Gestor-Events_i_Personal/releases'
      )}
    </div>
  );
};

export default GithubReleases;
