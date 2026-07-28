from typing import Dict
from .processor import VideoProcessor

class StreamManager:
    """
    Manages multiple concurrent video processing streams.
    Ensures that only one processor runs per camera to save resources.
    """
    def __init__(self):
        # Maps camera_id to its VideoProcessor instance
        self.active_streams: Dict[int, VideoProcessor] = {}

    def start_stream(self, camera_id: int, source_url: str) -> VideoProcessor:
        """Starts a new stream or returns the existing one if already running."""
        if camera_id in self.active_streams and self.active_streams[camera_id].is_running:
            return self.active_streams[camera_id]
            
        processor = VideoProcessor(camera_id=camera_id, source_url=source_url)
        self.active_streams[camera_id] = processor
        return processor

    def stop_stream(self, camera_id: int):
        """Stops an active stream and cleans up resources."""
        if camera_id in self.active_streams:
            self.active_streams[camera_id].stop()
            del self.active_streams[camera_id]

# Global singleton to manage streams across the FastAPI app
stream_manager = StreamManager()
