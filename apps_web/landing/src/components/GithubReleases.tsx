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
  android: PlatformAsset | null;
}

interface DetectedOS {
  name: string;
  type: 'windows' | 'macos' | 'linux' | 'android' | 'unknown';
}

const GithubReleases: React.FC = () => {
  const { t } = useTranslation();
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
          // Android: contains "android" AND (.apk or .zip)
          if (filename.includes('android') && (filename.endsWith('.apk') || filename.endsWith('.zip'))) {
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
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        <div className="md:col-span-2 lg:col-span-4 bg-amber-900/30 p-6 rounded-xl border border-amber-700/50">
          <h3 className="text-lg font-semibold text-amber-300 mb-2">{t('releases.error_title')}</h3>
          <p className="text-amber-200/80 mb-4">
            {t('releases.error_description')}
          </p>
          <a
            href="https://github.com/Pepelocotango/Gestor-Events_i_Personal/releases"
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
    platformType: 'windows' | 'macos' | 'linux' | 'android' | 'unknown',
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
            ? platformType === 'android'
              ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-2 border-green-600/50 shadow-lg'
              : 'bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border-2 border-blue-600/50 shadow-lg'
            : platformType === 'android'
              ? 'bg-gray-800 border border-gray-700'
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
            <span
              className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                platformType === 'android'
                  ? 'bg-green-700/60 text-green-200'
                  : 'bg-blue-700/60 text-blue-200'
              }`}
            >
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
              className={`inline-flex items-center justify-center w-full px-6 py-3 ${
                platformType === 'android'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600'
              } text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {platformType === 'android' ? t('releases.download_apk') : t('releases.download_for', { platform: platformName })}
            </a>
            <p className="text-xs text-gray-400 mt-3 break-words">{asset?.filename} - {asset?.size}</p>
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
              {t('releases.view_releases')}
            </a>
            <p className="text-xs text-gray-400 mt-3">{t('releases.at_github')}</p>
          </>
        )}

        {platformType === 'android' && (
          <>
            <p className="text-xs text-gray-400 mt-3 font-medium">{t('releases.manual_installation')}</p>
            <p className="text-xs text-gray-500">{t('releases.not_on_play_store')}</p>
            {asset?.filename.endsWith('.zip') && (
              <p className="text-xs text-amber-400 mt-2">{t('releases.contains_apk')}</p>
            )}
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
        <svg className="w-12 h-12 mb-4 text-blue-600" viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
          <path d="M0 12.402l35.687-4.86.016 34.423-35.67.203zm35.67 33.529l.028 34.253L.028 75.029.017 46.035zm4.324-39.226L88 0v41.558l-47.98.053zm47.957 37.378L88 88 40.031 81.233 40.005 44.22z"/>
        </svg>,
        'Windows 10/11 (64-bit)',
        'https://github.com/Pepelocotango/Gestor-Events_i_Personal/releases/latest'
      )}

      {renderPlatformCard(
        'macOS',
        'macos',
        <svg className="w-12 h-12 mb-4 text-gray-900 dark:text-white" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z"/>
        </svg>,
        'macOS 10.15 o posterior',
        'https://github.com/Pepelocotango/Gestor-Events_i_Personal/releases/latest'
      )}

      {renderPlatformCard(
        'Linux',
        'linux',
        <svg role="img" className="w-12 h-12 mb-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <title>Linux</title>
          <path fill="currentColor" d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 0 0-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 0 0-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 0 1-.004-.021l-.004-.024a1.807 1.807 0 0 1-.15.706.953.953 0 0 1-.213.335.71.71 0 0 0-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 0 0-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 0 0-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 0 0-.205.334 1.18 1.18 0 0 0-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 0 1-.018-.2v-.02a1.772 1.772 0 0 1 .15-.768c.082-.22.232-.406.43-.533a.985.985 0 0 1 .594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667v.004c.007.134.006.2-.002.266v.08c-.03.007-.056.018-.083.024-.152.055-.274.135-.393.2.012-.09.013-.18.003-.267v-.015c-.012-.133-.04-.2-.082-.333a.613.613 0 0 0-.166-.267.248.248 0 0 0-.183-.064h-.021c-.071.006-.13.04-.186.132a.552.552 0 0 0-.12.27.944.944 0 0 0-.023.33v.015c.012.135.037.2.08.334.046.134.098.2.166.268.01.009.02.018.034.024-.07.057-.117.07-.176.136a.304.304 0 0 1-.131.068 2.62 2.62 0 0 1-.275-.402 1.772 1.772 0 0 1-.155-.667 1.759 1.759 0 0 1 .08-.668 1.43 1.43 0 0 1 .283-.535c.128-.133.26-.2.418-.2zm1.37 1.706c.332 0 .733.065 1.216.399.293.2.523.269 1.052.468h.003c.255.136.405.266.478.399v-.131a.571.571 0 0 1 .016.47c-.123.31-.516.643-1.063.842v.002c-.268.135-.501.333-.775.465-.276.135-.588.292-1.012.267a1.139 1.139 0 0 1-.448-.067 3.566 3.566 0 0 1-.322-.198c-.195-.135-.363-.332-.612-.465v-.005h-.005c-.4-.246-.616-.512-.686-.71-.07-.268-.005-.47.193-.6.224-.135.38-.271.483-.336.104-.074.143-.102.176-.131h.002v-.003c.169-.202.436-.47.839-.601.139-.036.294-.065.466-.065zm2.8 2.142c.358 1.417 1.196 3.475 1.735 4.473.286.534.855 1.659 1.102 3.024.156-.005.33.018.513.064.646-1.671-.546-3.467-1.089-3.966-.22-.2-.232-.335-.123-.335.59.534 1.365 1.572 1.646 2.757.13.535.16 1.104.021 1.67.067.028.135.06.205.067 1.032.534 1.413.938 1.23 1.537v-.043c-.06-.003-.12 0-.18 0h-.016c.151-.467-.182-.825-1.065-1.224-.915-.4-1.646-.336-1.77.465-.008.043-.013.066-.018.135-.068.023-.139.053-.209.064-.43.268-.662.669-.793 1.187-.13.533-.17 1.156-.205 1.869v.003c-.02.334-.17.838-.319 1.35-1.5 1.072-3.58 1.538-5.348.334a2.645 2.645 0 0 0-.402-.533 1.45 1.45 0 0 0-.275-.333c.182 0 .338-.03.465-.067a.615.615 0 0 0 .314-.334c.108-.267 0-.697-.345-1.163-.345-.467-.931-.995-1.788-1.521-.63-.4-.986-.87-1.15-1.396-.165-.534-.143-1.085-.015-1.645.245-1.07.873-2.11 1.274-2.763.107-.065.037.135-.408.974-.396.751-1.14 2.497-.122 3.854a8.123 8.123 0 0 1 .647-2.876c.564-1.278 1.743-3.504 1.836-5.268.048.036.217.135.289.202.218.133.38.333.59.465.21.201.477.335.876.335.039.003.075.006.11.006.412 0 .73-.134.997-.268.29-.134.52-.334.74-.4h.005c.467-.135.835-.402 1.044-.7zm2.185 8.958c.037.6.343 1.245.882 1.377.588.134 1.434-.333 1.791-.765l.211-.01c.315-.007.577.01.847.268l.003.003c.208.199.305.53.391.876.085.4.154.78.409 1.066.486.527.645.906.636 1.14l.003-.007v.018l-.003-.012c-.015.262-.185.396-.498.595-.63.401-1.746.712-2.457 1.57-.618.737-1.37 1.14-2.036 1.191-.664.053-1.237-.2-1.574-.898l-.005-.003c-.21-.4-.12-1.025.056-1.69.176-.668.428-1.344.463-1.897.037-.714.076-1.335.195-1.814.12-.465.308-.797.641-.984l.045-.022zm-10.814.049h.01c.053 0 .105.005.157.014.376.055.706.333 1.023.752l.91 1.664.003.003c.243.533.754 1.064 1.189 1.637.434.598.77 1.131.729 1.57v.006c-.057.744-.48 1.148-1.125 1.294-.645.135-1.52.002-2.395-.464-.968-.536-2.118-.469-2.857-.602-.369-.066-.61-.2-.723-.4-.11-.2-.113-.602.123-1.23v-.004l.002-.003c.117-.334.03-.752-.027-1.118-.055-.401-.083-.71.043-.94.16-.334.396-.4.69-.533.294-.135.64-.202.915-.47h.002v-.002c.256-.268.445-.601.668-.838.19-.201.38-.336.663-.336zm7.159-9.074c-.435.201-.945.535-1.488.535-.542 0-.97-.267-1.28-.466-.154-.134-.28-.268-.373-.335-.164-.134-.144-.333-.074-.333.109.016.129.134.199.2.096.066.215.2.36.333.292.2.68.467 1.167.467.485 0 1.053-.267 1.398-.466.195-.135.445-.334.648-.467.156-.136.149-.267.279-.267.128.016.034.134-.147.332a8.097 8.097 0 0 1-.69.468zm-1.082-1.583V5.64c-.006-.02.013-.042.029-.05.074-.043.18-.027.26.004.063 0 .16.067.15.135-.006.049-.085.066-.135.066-.055 0-.092-.043-.141-.068-.052-.018-.146-.008-.163-.065zm-.551 0c-.02.058-.113.049-.166.066-.047.025-.086.068-.14.068-.05 0-.13-.02-.136-.068-.01-.066.088-.133.15-.133.08-.031.184-.047.259-.005.019.009.036.03.03.05v.02h.003z"/>
        </svg>,
        '.deb, .rpm i AppImage',
        'https://github.com/Pepelocotango/Gestor-Events_i_Personal/releases/latest'
      )}

      {renderPlatformCard(
        'Android',
        'android',
        <svg className="w-12 h-12 mb-4 text-green-500" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
          <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0225 3.503c-1.6704-.7617-3.5225-1.1895-5.4952-1.1895-1.9731 0-3.8256.4278-5.4969 1.1903l-2.0216-3.5038a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396"/>
        </svg>,
        'Android 6.0+',
        'https://github.com/Pepelocotango/Gestor-Events_i_Personal/releases'
      )}
    </div>
  );
};

export default GithubReleases;
