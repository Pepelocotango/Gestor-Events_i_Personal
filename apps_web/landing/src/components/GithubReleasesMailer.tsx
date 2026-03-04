import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
}

interface DetectedOS {
  name: string;
  type: 'windows' | 'macos' | 'linux' | 'unknown';
}

const GithubReleasesMailer: React.FC = () => {
  const { t } = useTranslation();
  const [release, setRelease] = useState<Release | null>(null);
  const [downloadLinks, setDownloadLinks] = useState<DownloadLinks>({
    windows: null,
    macos: null,
    linux: null,
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
    }

    setDetectedOS(osType);
  }, []);

  // Fetch releases de GitHub
  useEffect(() => {
    const fetchReleases = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          'https://api.github.com/repos/Pepelocotango/gep-mailer-proto/releases/latest'
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
    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-800 p-6 rounded-xl border border-gray-700 animate-pulse">
          <div className="w-16 h-16 bg-gray-700 rounded-2xl mx-auto mb-6"></div>
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="h-4 bg-gray-700 rounded mb-6 w-3/4"></div>
          <div className="h-12 bg-gray-700 rounded-lg mb-3"></div>
          <div className="h-3 bg-gray-700 rounded w-2/3"></div>
        </div>
      ))}
    </div>
  );

  // Error Fallback Component
  if (error || (!loading && !release)) {
    return (
      <div className="grid md:grid-cols-1 gap-6 max-w-4xl mx-auto">
        <div className="bg-amber-900/30 p-6 rounded-xl border border-amber-700/50">
          <h3 className="text-lg font-semibold text-amber-300 mb-2">{t('releases.error_title')}</h3>
          <p className="text-amber-200/80 mb-4">
            {t('releases.error_description')}
          </p>
          <a
            href="https://github.com/Pepelocotango/gep-mailer-proto/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            {t('releases.go_to_github')}
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
    platformType: 'windows' | 'macos' | 'linux' | 'unknown',
    icon: React.ReactNode,
    requirements: string,
    fallbackUrl: string
  ) => {
    const asset = platformType === 'unknown' ? null : downloadLinks[platformType];
    const isRecommended = detectedOS.type === platformType && platformType !== 'unknown';

    return (
      <div
        key={platformType}
        className={`group ${
          isRecommended
            ? 'bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border-2 border-blue-600/50 shadow-lg'
            : 'bg-gray-800 border border-gray-700'
        } pt-8 pb-6 px-6 rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
      >
        <div className="h-4"></div>
        <div
          className={`w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 transition-colors`}
        >
          {icon}
        </div>

        {isRecommended && (
          <div className="mb-3">
            <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-blue-700/60 text-blue-200">
              {t('releases.recommended')}
            </span>
          </div>
        )}

        <h3 className="text-xl font-semibold mb-2 text-white">{platformName}</h3>
        <p className="text-gray-400 text-sm mb-6">{requirements}</p>

        {asset ? (
          <>
            <a
              href={asset?.url}
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('releases.download_for', { platform: platformName })}
            </a>
            <p className="text-xs text-gray-400 mt-3 break-words">{asset?.filename} - {asset?.size}</p>
          </>
        ) : (
          <>
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('releases.view_releases')}
            </a>
            <p className="text-xs text-gray-400 mt-3">{t('releases.at_github')}</p>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {renderPlatformCard(
        'Windows',
        'windows',
        <svg className="w-12 h-12 mb-4 text-blue-600" viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
          <path d="M0 12.402l35.687-4.86.016 34.423-35.67.203zm35.67 33.529l.028 34.253L.028 75.029.017 46.035zm4.324-39.226L88 0v41.558l-47.98.053zm47.957 37.378L88 88 40.031 81.233 40.005 44.22z"/>
        </svg>,
        'Windows 10/11 (64-bit)',
        'https://github.com/Pepelocotango/gep-mailer-proto/releases/latest'
      )}

      {renderPlatformCard(
        'macOS',
        'macos',
        <svg className="w-12 h-12 mb-4 text-gray-900 dark:text-white" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z"/>
        </svg>,
        'macOS 10.14+',
        'https://github.com/Pepelocotango/gep-mailer-proto/releases/latest'
      )}

      {renderPlatformCard(
        'Linux',
        'linux',
        <svg role="img" className="w-12 h-12 mb-4 text-black" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <title>Linux</title>
          <path fill="currentColor" d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 0 0-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 0 0-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 0 1-.004-.021l-.004-.024a1.807 1.807 0 0 1-.15.706.953.953 0 0 1-.213.335.71.71 0 0 0-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 0 0-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 0 0-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 0 0-.205.334 1.18 1.18 0 0 0-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 0 1-.018-.2v-.02a1.772 1.772 0 0 1 .15-.768c.082-.22.232-.406.43-.533a.985.985 0 0 1 .594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667v.004c.007.134.006.2-.002.266v.08c-.03.007-.056.018-.083.024-.152.055-.274.135-.393.2.012-.09.013-.18.003-.267v-.015c-.012-.133-.04-.2-.082-.333a.613.613 0 0 0-.166-.267.248.248 0 0 0-.183-.064h-.021c-.071.006-.13.04-.186.132a.552.552 0 0 0-.12.27.944.9 0 0 0-.018.2v.015c.006.089.016.179.03.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 0 1-.018-.2v-.02c.003-.267.053-.568.15-.768.082-.22.232-.406.43-.533a.985.985 0 0 1 .594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667v.004c.007.134.006.2-.002.266v.08c-.03.007-.056.018-.083.024-.152.055-.274.135-.393.2.012-.09.013-.18.003-.267v-.015c-.012-.133-.04-.2-.082-.333a.613.613 0 0 0-.166-.267.248.248 0 0 0-.183-.064h-.021c-.071.006-.13.04-.186.132a.552.552 0 0 0-.12.27.944.9 0 0 0-.018.2v.015c.006.089.016.179.03.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 0 1-.018-.2v-.02c.003-.267.053-.568.15-.768.082-.22.232-.406.43-.533a.985.985 0 0 1 .594-.2z"/>
        </svg>,
        'Ubuntu 18.04+',
        'https://github.com/Pepelocotango/gep-mailer-proto/releases/latest'
      )}
    </div>
  );
};

export default GithubReleasesMailer;
