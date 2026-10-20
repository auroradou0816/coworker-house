import React, { useEffect, useRef, useState } from 'react';
import {
  addToast,
  Button,
  useDisclosure,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { CodeAgentBackend, Room, RoomRenameHandler, RoomType } from '../utils/types';
import { createRoom } from '../utils/socket';
import { buildRoomShareUrl, validateRoomName } from '../utils/roomState';
import { RoomCard } from './RoomCard';
import { RoomCreateModal, RoomCreateOptions } from './RoomCreateModal';
import { RoomJoinControl } from './RoomJoinControl';
import { RoomRenameModal } from './RoomRenameModal';
import { AppConfirmDialog } from './AppActionDialog';

interface RoomListProps {
  rooms: Room[];
  isLoading?: boolean;
  onRoomSelect: (room: Room) => void;
  onRoomSelectById: (roomId: string) => void;
  handleDeleteRoom: (roomId: string) => void;
  handleRenameRoom: RoomRenameHandler;
  clientId: string;
  username: string;
  isCodeAgentEnabled: boolean;
  codeAgentDefaultBackend?: CodeAgentBackend;
  onModalTaskStart?: () => void;
}

export const RoomList: React.FC<RoomListProps> = ({ rooms, isLoading = false, onRoomSelect, onRoomSelectById, handleDeleteRoom, handleRenameRoom, clientId, username, isCodeAgentEnabled, codeAgentDefaultBackend = 'code-agent', onModalTaskStart }) => {
  const { t } = useTranslation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomType, setNewRoomType] = useState<RoomType>('chat');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [roomToRename, setRoomToRename] = useState<Room | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const copyFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCopyFeedbackTimer = () => {
    if (copyFeedbackTimerRef.current) {
      clearTimeout(copyFeedbackTimerRef.current);
      copyFeedbackTimerRef.current = null;
    }
  };

  useEffect(() => {
    return clearCopyFeedbackTimer;
  }, []);

  const showCopiedLink = (roomId: string) => {
    clearCopyFeedbackTimer();
    setCopiedLinkId(roomId);
    setCopiedRoomId(null);
    copyFeedbackTimerRef.current = setTimeout(() => {
      setCopiedLinkId(current => current === roomId ? null : current);
      copyFeedbackTimerRef.current = null;
    }, 2000);
  };

  const showCopiedRoomId = (roomId: string) => {
    clearCopyFeedbackTimer();
    setCopiedRoomId(roomId);
    setCopiedLinkId(null);
    copyFeedbackTimerRef.current = setTimeout(() => {
      setCopiedRoomId(current => current === roomId ? null : current);
      copyFeedbackTimerRef.current = null;
    }, 2000);
  };

  const handleCreateRoom = async (options: RoomCreateOptions) => {
    const validation = validateRoomName(newRoomName);

    if (!validation.ok) {
      setNameError(t(validation.errorKey));
      return;
    }

    setNameError(null);
    setCreateError(null);
    setIsCreating(true);
    try {
      const roomId = await createRoom(validation.name, newRoomDescription, {
        password: options.password,
        postingSchedule: options.postingSchedule,
        type: isCodeAgentEnabled ? (options.type || newRoomType) : 'chat',
        codeAgentBackend: isCodeAgentEnabled && (options.type || newRoomType) === 'codeAgent'
          ? codeAgentDefaultBackend
          : undefined,
      });
      setNewRoomName('');
      setNewRoomDescription('');
      setNewRoomType('chat');
      onClose();
      onRoomSelectById(roomId as string);
    } catch (error) {
      console.error('Error creating room:', error);
      setCreateError(error instanceof Error ? error.message : t('createRoomFailed'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = () => {
    const trimmedId = joinRoomId.trim();
    if (!trimmedId) return;
    onRoomSelectById(trimmedId);
    setJoinRoomId('');
  };

  const handleOpenCreateModal = () => {
    onModalTaskStart?.();
    setNewRoomName(`${username}'s Room`);
    setNewRoomDescription('');
    setNewRoomType('chat');
    setNameError(null);
    setCreateError(null);
    onOpen();
  };

  const openDeleteModal = (room: Room) => {
    onModalTaskStart?.();
    setRoomToDelete(room);
  };

  const openRenameModal = (room: Room) => {
    onModalTaskStart?.();
    setRoomToRename(room);
  };

  const confirmRoomDelete = () => {
    if (roomToDelete) {
      handleDeleteRoom(roomToDelete.id);
    }
    setRoomToDelete(null);
  };

  const handleCopyRoomLink = (roomId: string) => {
    const roomUrl = buildRoomShareUrl(window.location.origin, window.location.pathname, roomId);

    navigator.clipboard.writeText(roomUrl)
      .then(() => showCopiedLink(roomId))
      .catch(err => {
        console.error('Could not copy URL:', err);
        addToast({ title: t('shareFailed'), severity: 'danger', timeout: 4500 });
      });
  };

  const handleCopyRoomId = (roomId: string) => {
    navigator.clipboard.writeText(roomId)
      .then(() => showCopiedRoomId(roomId))
      .catch(err => {
        console.error('Could not copy Room ID:', err);
        addToast({ title: t('copyFailed'), severity: 'danger', timeout: 4500 });
      });
  };

  const handleRoomNameChange = (value: string) => {
    setNewRoomName(value);
    setNameError(null);
    setCreateError(null);
  };

  const createModal = (
    <RoomCreateModal
      isOpen={isOpen}
      onClose={onClose}
      roomName={newRoomName}
      roomDescription={newRoomDescription}
      roomType={newRoomType}
      nameError={nameError}
      createError={createError}
      isCreating={isCreating}
      isCodeAgentEnabled={isCodeAgentEnabled}
      onRoomNameChange={handleRoomNameChange}
      onRoomDescriptionChange={setNewRoomDescription}
      onRoomTypeChange={setNewRoomType}
      onCreate={handleCreateRoom}
    />
  );

  return (
    <div className="studio-home">
      <header className="studio-masthead">
        <span className="studio-eyebrow">{t('studioLabel')}</span>
        <span className="studio-wordmark">CoWorker House</span>
      </header>
      <section className="studio-hero" aria-labelledby="studio-title">
        <div className="studio-hero-copy">
          <p className="studio-kicker">{t('studioKicker')}</p>
          <h2 id="studio-title">{t('studioTitle')}</h2>
          <p className="studio-description">{t('studioDescription')}</p>
          <Button onPress={handleOpenCreateModal} className="studio-create" endContent={<Icon icon="lucide:arrow-up-right" className="h-5 w-5" />}>
            {t('create')}
          </Button>
        </div>
        <div className="studio-art" aria-hidden="true">
          <div className="studio-orbit" />
          <div className="studio-art-tile studio-art-tile-chat"><Icon icon="lucide:messages-square" /></div>
          <div className="studio-art-tile studio-art-tile-code"><Icon icon="lucide:code-2" /></div>
          <div className="studio-art-spark">✳</div>
          <span className="studio-art-dot" />
        </div>
      </section>
      <section className="studio-join" aria-label={t('joinButton')}>
        <div>
          <h3>{t('studioJoinTitle')}</h3>
          <p>{t('studioJoinDescription')}</p>
        </div>
        <RoomJoinControl
          value={joinRoomId}
          onValueChange={setJoinRoomId}
          onJoin={handleJoinRoom}
          containerClassName="flex w-full min-w-0 sm:max-w-sm"
          inputHeightClassName="h-12"
          buttonClassName="h-12 min-w-[88px]"
        />
      </section>
      <section className="studio-rooms" aria-labelledby="studio-rooms-title">
        <div className="studio-section-heading">
          <h3 id="studio-rooms-title">{t('studioRoomsTitle')}</h3>
          <span className="studio-room-count">{isLoading ? '…' : rooms.length}</span>
        </div>
        {isLoading && rooms.length === 0 ? (
          <div role="status" aria-live="polite" aria-busy="true">
            <span className="sr-only">{t('loading')}</span>
            <div className="studio-room-grid">
              {[0, 1, 2].map(index => <div key={index} className="studio-skeleton motion-safe:animate-pulse" />)}
            </div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="studio-empty">
            <span className="studio-empty-icon" aria-hidden="true"><Icon icon="lucide:move-up-right" /></span>
            <div><h4>{t('noRoomsAvailable')}</h4><p>{t('noRoomsDescription')}</p></div>
            <Button variant="light" onPress={handleOpenCreateModal} className="shrink-0" aria-label={t('create')}>
              <Icon icon="lucide:plus" className="mr-1 h-4 w-4" />{t('create')}
            </Button>
          </div>
        ) : (
          <div className="studio-room-grid">
            {rooms.map(room => (
              <RoomCard
                key={room.id}
                room={room}
                clientId={clientId}
                copiedRoomId={copiedRoomId}
                copiedLinkId={copiedLinkId}
                onSelect={onRoomSelect}
                onCopyRoomId={handleCopyRoomId}
                onCopyRoomLink={handleCopyRoomLink}
                onRename={openRenameModal}
                onDelete={openDeleteModal}
                codeAgentDefaultBackend={codeAgentDefaultBackend}
              />
            ))}
          </div>
        )}
      </section>

      <AppConfirmDialog
        isOpen={roomToDelete !== null}
        title={t('confirmDeleteRoomTitle')}
        description={t('confirmDeleteRoomDescription', { roomName: roomToDelete?.name })}
        confirmLabel={t('delete')}
        tone="danger"
        onClose={() => setRoomToDelete(null)}
        onConfirm={confirmRoomDelete}
      />

      {createModal}
      <RoomRenameModal
        isOpen={!!roomToRename}
        room={roomToRename}
        onClose={() => setRoomToRename(null)}
        onRename={handleRenameRoom}
      />
    </div>
  );
};
