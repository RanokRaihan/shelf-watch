import { LoaderCircle } from "lucide-react";

// Aiming box as fractions of the preview; the scanner crops the same region.
export const AIM_BOX = { width: 0.8, height: 0.4 };

const CORNER = "absolute size-7 border-primary";

// The frame, scrim and spinner are fixed black/white because they sit over live video.
export function CameraPreview({
  videoRef,
  loading,
}: {
  videoRef: React.Ref<HTMLVideoElement>;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          aria-label="Camera preview"
          className="absolute inset-0 size-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute rounded-lg shadow-[0_0_0_9999px_rgb(0_0_0/0.5)]"
          style={{
            width: `${AIM_BOX.width * 100}%`,
            height: `${AIM_BOX.height * 100}%`,
            left: `${((1 - AIM_BOX.width) / 2) * 100}%`,
            top: `${((1 - AIM_BOX.height) / 2) * 100}%`,
          }}
        >
          <span className={`${CORNER} top-0 left-0 rounded-tl-lg border-t-4 border-l-4`} />
          <span className={`${CORNER} top-0 right-0 rounded-tr-lg border-t-4 border-r-4`} />
          <span className={`${CORNER} bottom-0 left-0 rounded-bl-lg border-b-4 border-l-4`} />
          <span className={`${CORNER} right-0 bottom-0 rounded-br-lg border-r-4 border-b-4`} />
          {!loading && (
            <span className="absolute inset-x-4 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-primary motion-reduce:animate-none" />
          )}
        </div>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoaderCircle className="size-8 animate-spin text-white" aria-label="Starting camera" />
          </div>
        )}
      </div>
      <p className="text-center text-base text-muted-foreground">
        Line up the barcode inside the box.
      </p>
    </div>
  );
}
