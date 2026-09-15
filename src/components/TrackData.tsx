export default function TrackData({ path }: { path: string }) {
  const json = JSON.stringify({ path }).replace(/</g, '\\u003c');
  return <script type="application/json" id="track-data" dangerouslySetInnerHTML={{ __html: json }} />;
}
