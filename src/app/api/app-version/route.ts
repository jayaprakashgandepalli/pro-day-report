import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch(
      'https://api.github.com/repos/navanidhicare-eng/pro-day-report/releases/tags/latest-apk',
      {
        headers: {
          'User-Agent': 'PRO-Day-Report-Server',
          Accept: 'application/vnd.github.v3+json',
        },
        cache: 'no-store',
      }
    );

    if (res.ok) {
      const release = await res.json();
      const apkAsset = release.assets?.find((a: any) => a.name.endsWith('.apk'));

      // Extract build number from release name or body (e.g. v1.0.12 or BUILD_NUMBER: 12)
      let buildNumber = 1;
      let versionName = '1.0.0';

      const body = release.body || '';
      const buildMatch = body.match(/BUILD_NUMBER:\s*(\d+)/i) || release.name?.match(/v?1\.0\.(\d+)/i);
      if (buildMatch) {
        buildNumber = parseInt(buildMatch[1], 10);
        versionName = `1.0.${buildNumber}`;
      }

      return NextResponse.json({
        success: true,
        versionName,
        buildNumber,
        downloadUrl: apkAsset?.browser_download_url || 'https://github.com/navanidhicare-eng/pro-day-report/releases/download/latest-apk/PRO_Day_Report.apk',
        updatedAt: apkAsset?.updated_at || release.published_at,
        sizeBytes: apkAsset?.size || 0,
        releaseNotes: release.body || 'New features, bug fixes, and performance improvements.',
      });
    }

    return NextResponse.json({
      success: true,
      versionName: '1.0.0',
      buildNumber: 1,
      downloadUrl: 'https://github.com/navanidhicare-eng/pro-day-report/releases/download/latest-apk/PRO_Day_Report.apk',
      releaseNotes: 'General performance improvements.',
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to check app version',
      downloadUrl: 'https://github.com/navanidhicare-eng/pro-day-report/releases/download/latest-apk/PRO_Day_Report.apk',
    }, { status: 500 });
  }
}
