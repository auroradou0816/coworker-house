import React from 'react';
import {
  Button,
  Card,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { CodeAgentBackend, Room } from '../utils/types';
import { formatDate } from '../utils/formatters';
import { getRoomActivityAt } from '../utils/roomState';
import { getCodeAgentBackend } from '../utils/codeAgent';

interface RoomCardProps {
  room: Room;
  clientId: string;
  copiedRoomId: string | null;
  copiedLinkId: string | null;
  onSelect: (room: Room) => void;
  onCopyRoomId: (roomId: string) => void;
  onCopyRoomLink: (roomId: string) => void;
  onRename: (room: Room) => void;
  onDelete: (room: Room) => void;
  codeAgentDefaultBackend?: CodeAgentBackend;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  clientId,
  copiedRoomId,
  copiedLinkId,
  onSelect,
  onCopyRoomId,
  onCopyRoomLink,
  onRename,
  onDelete,
  codeAgentDefaultBackend = 'code-agent',
}) => {
  const { t, i18n } = useTranslation();
  const activityAt = getRoomActivityAt(room);
  const codeAgentBackend = getCodeAgentBackend(room, codeAgentDefaultBackend);
  const isCodeAgent = codeAgentBackend !== null;

  return (
    <Card
      data-testid="room-card"
      data-room-id={room.id}
      className="cursor-pointer rounded-lg border border-[#dbe3ee] bg-[#f8fafc] p-4 shadow-[0_0_0_1px_rgba(194,192,182,0.4)] transition-all duration-200 hover:bg-[#eaf0f7] active:bg-[#e2e8f0] dark:border-[#253247] dark:bg-[#101827] dark:hover:bg-[#253247]"
    >
      <div className="flex items-start">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start text-left outline-none"
          onClick={() => onSelect(room)}
        >
          <div
            className="mr-3 rounded-xl bg-[#e2e8f0] p-2.5 text-[#0891b2] dark:bg-[#253247] dark:text-[#67e8f9]"
            title={isCodeAgent ? t('codeAgentRoomType') : undefined}
          >
            <Icon icon={isCodeAgent ? 'lucide:terminal' : 'lucide:message-circle'} className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex min-w-0 items-center">
              <h3 className="min-w-0 flex-1 truncate font-medium text-[#0b101b] dark:text-[#f8fafc]">{room.name}</h3>
            </div>
            {room.description && (
              <p className="mb-2 line-clamp-2 text-xs text-[#526176] dark:text-[#a8b6cc]">{room.description}</p>
            )}
            <div className="mt-2 flex min-w-0 items-center gap-2">
              <p
                className="flex min-w-0 items-center gap-1 text-xs text-[#526176] dark:text-[#a8b6cc]"
                title={room.id}
                aria-label={`ID: ${room.id}`}
              >
                <Icon icon="lucide:hash" className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                <span className="truncate" aria-hidden="true">
                  {room.id.length > 12 ? `${room.id.slice(0, 10)}…` : room.id}
                </span>
                <span className="sr-only">{room.id}</span>
              </p>

              {activityAt && (
                <span className="ml-2 hidden whitespace-nowrap text-xs text-[#526176] dark:text-[#a8b6cc] md:inline-block">
                  {formatDate(activityAt, i18n.language)}
                </span>
              )}
            </div>
          </div>
        </button>
        <div className="ml-1 flex flex-shrink-0 items-center">
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                aria-label={`${t('moreActions')} ${room.name}`}
                className="h-9 w-9 min-w-9 rounded-lg text-[#526176] data-[hover=true]:bg-[#e2e8f0] dark:text-[#a8b6cc] dark:data-[hover=true]:bg-[#253247]"
              >
                <Icon icon="lucide:ellipsis" className="h-4 w-4" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label={`${t('moreActions')} ${room.name}`}
              onAction={(key) => {
                if (key === 'copy') onCopyRoomId(room.id);
                if (key === 'share') onCopyRoomLink(room.id);
                if (key === 'rename') onRename(room);
                if (key === 'delete') onDelete(room);
              }}
            >
              <DropdownItem
                key="copy"
                startContent={<Icon icon={copiedRoomId === room.id ? 'lucide:check' : 'lucide:copy'} className="h-4 w-4" />}
              >
                {copiedRoomId === room.id ? t('copyRoomIdSuccess') : t('copyRoomId')}
              </DropdownItem>
              <DropdownItem
                key="share"
                startContent={<Icon icon={copiedLinkId === room.id ? 'lucide:check' : 'lucide:share-2'} className="h-4 w-4" />}
              >
                {copiedLinkId === room.id ? t('shareSuccess') : t('share')}
              </DropdownItem>
              {room.creatorId === clientId ? (
                <DropdownItem key="rename" startContent={<Icon icon="lucide:pencil" className="h-4 w-4" />}>
                  {t('editRoomName')}
                </DropdownItem>
              ) : null}
              {room.creatorId === clientId ? (
                <DropdownItem
                  key="delete"
                  color="danger"
                  className="text-danger"
                  startContent={<Icon icon="lucide:trash-2" className="h-4 w-4" />}
                >
                  {t('deleteRoom')}
                </DropdownItem>
              ) : null}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </Card>
  );
};
