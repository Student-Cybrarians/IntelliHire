import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InterviewCameraPreview from './InterviewCameraPreview';

describe('InterviewCameraPreview Component', () => {
  let mockStop: any;
  let mockTrack: any;
  let mockStream: any;

  beforeEach(() => {
    mockStop = vi.fn();
    mockTrack = {
      stop: mockStop,
      kind: 'video',
      enabled: true
    };
    mockStream = {
      getTracks: vi.fn(() => [mockTrack]),
      getVideoTracks: vi.fn(() => [mockTrack]),
      getAudioTracks: vi.fn(() => [{ stop: mockStop, enabled: true }])
    };

    // Mock mediaDevices.getUserMedia
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream)
      },
      writable: true,
      configurable: true
    });
  });

  it('renders default camera inactive state and privacy charter banner', () => {
    render(<InterviewCameraPreview />);

    expect(screen.getByText(/Camera preview is currently inactive/i)).toBeInTheDocument();
    expect(screen.getByText(/CAMERA OFF/i)).toBeInTheDocument();
    expect(screen.getByText(/Privacy & Fairness Invariant/i)).toBeInTheDocument();
    expect(screen.getByText(/never recorded, uploaded, or analyzed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enable Camera Preview/i })).toBeInTheDocument();
  });

  it('activates live preview and invokes callback when user clicks Enable Camera Preview', async () => {
    const onStateChange = vi.fn();
    render(<InterviewCameraPreview onCameraStateChange={onStateChange} />);

    const enableBtn = screen.getByRole('button', { name: /Enable Camera Preview/i });
    fireEvent.click(enableBtn);

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true
      });
      expect(screen.getByText(/LIVE PREVIEW/i)).toBeInTheDocument();
      expect(onStateChange).toHaveBeenCalledWith(true);
    });
  });

  it('stops media tracks cleanly when user toggles camera off', async () => {
    const onStateChange = vi.fn();
    render(<InterviewCameraPreview onCameraStateChange={onStateChange} />);

    // Enable first
    fireEvent.click(screen.getByRole('button', { name: /Enable Camera Preview/i }));

    await waitFor(() => {
      expect(screen.getByText(/LIVE PREVIEW/i)).toBeInTheDocument();
    });

    // Turn off
    const turnOffBtn = screen.getByRole('button', { name: /Turn Off/i });
    fireEvent.click(turnOffBtn);

    await waitFor(() => {
      expect(mockStop).toHaveBeenCalled();
      expect(screen.getByText(/CAMERA OFF/i)).toBeInTheDocument();
      expect(onStateChange).toHaveBeenCalledWith(false);
    });
  });

  it('handles camera permission denial gracefully without breaking UI', async () => {
    const notAllowedError = new Error('Permission denied');
    notAllowedError.name = 'NotAllowedError';
    (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(notAllowedError);

    render(<InterviewCameraPreview />);

    fireEvent.click(screen.getByRole('button', { name: /Enable Camera Preview/i }));

    await waitFor(() => {
      expect(screen.getByText(/Camera \/ Microphone permission denied/i)).toBeInTheDocument();
      expect(screen.getByText(/CAMERA OFF/i)).toBeInTheDocument();
    });
  });
});
