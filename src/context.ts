import type * as tt from '../typings/telegram-types'
import type ApiClient from './core/network/client'
import type { Tail } from './types'
import type Telegram from './telegram'

type Shorthand<FName extends Exclude<keyof Telegram, keyof ApiClient>> = Tail<
  Parameters<Telegram[FName]>
>

const UpdateTypes = [
  'callback_query',
  'channel_post',
  'chosen_inline_result',
  'edited_channel_post',
  'edited_message',
  'inline_query',
  'shipping_query',
  'pre_checkout_query',
  'message',
  'poll',
  'poll_answer',
] as const

const MessageSubTypes = [
  'voice',
  'video_note',
  'video',
  'animation',
  'venue',
  'text',
  'supergroup_chat_created',
  'successful_payment',
  'sticker',
  'pinned_message',
  'photo',
  'new_chat_title',
  'new_chat_photo',
  'new_chat_members',
  'migrate_to_chat_id',
  'migrate_from_chat_id',
  'location',
  'left_chat_member',
  'invoice',
  'group_chat_created',
  'game',
  'dice',
  'document',
  'delete_chat_photo',
  'contact',
  'channel_chat_created',
  'audio',
  'connected_website',
  'passport_data',
  'poll',
  'forward_date',
] as const

const MessageSubTypesMapping = {
  forward_date: 'forward',
}

class TelegrafContext {
  public botInfo?: tt.User
  readonly updateType: tt.UpdateType
  readonly updateSubTypes: ReadonlyArray<typeof MessageSubTypes[number]>
  /** @deprecated */
  private contextState?: any

  constructor(
    readonly update: tt.Update,
    readonly tg: Telegram,
    private readonly options: { channelMode?: boolean; username?: string } = {}
  ) {
    this.updateType = UpdateTypes.find((key) => key in this.update)!
    // prettier-ignore
    if (this.updateType === 'message' || (this.options.channelMode && this.updateType === 'channel_post')) {
      this.updateSubTypes = MessageSubTypes
        .filter((key) => key in this.update[this.updateType])
        .map((type) => MessageSubTypesMapping[type] || type)
    } else {
      this.updateSubTypes = []
    }
    Object.getOwnPropertyNames(TelegrafContext.prototype)
      .filter((key) => key !== 'constructor' && typeof this[key] === 'function')
      .forEach((key) => (this[key] = this[key].bind(this)))
  }

  get me() {
    return this.options.username
  }

  get telegram() {
    return this.tg
  }

  get message() {
    return this.update.message
  }

  get editedMessage() {
    return this.update.edited_message
  }

  get inlineQuery() {
    return this.update.inline_query
  }

  get shippingQuery() {
    return this.update.shipping_query
  }

  get preCheckoutQuery() {
    return this.update.pre_checkout_query
  }

  get chosenInlineResult() {
    return this.update.chosen_inline_result
  }

  get channelPost() {
    return this.update.channel_post
  }

  get editedChannelPost() {
    return this.update.edited_channel_post
  }

  get callbackQuery() {
    return this.update.callback_query
  }

  get poll() {
    // @ts-expect-error
    return this.update.poll
  }

  get pollAnswer() {
    // @ts-expect-error
    return this.update.poll_answer
  }

  get chat() {
    return (
      this.message ??
      this.editedMessage ??
      this.callbackQuery?.message ??
      this.channelPost ??
      this.editedChannelPost
    )?.chat
  }

  get from() {
    return (
      this.message ??
      this.editedMessage ??
      this.callbackQuery ??
      this.inlineQuery ??
      this.channelPost ??
      this.editedChannelPost ??
      this.shippingQuery ??
      this.preCheckoutQuery ??
      this.chosenInlineResult
    )?.from
  }

  get inlineMessageId() {
    return (this.callbackQuery ?? this.chosenInlineResult)?.inline_message_id
  }

  get passportData() {
    // @ts-expect-error
    return this.message?.passport_data
  }

  get state() {
    if (!this.contextState) {
      this.contextState = {}
    }
    return this.contextState
  }

  set state(value) {
    this.contextState = { ...value }
  }

  get webhookReply(): boolean {
    return this.tg.webhookReply
  }

  set webhookReply(enable: boolean) {
    this.tg.webhookReply = enable
  }

  private assert<T extends string | object>(
    value: T | undefined,
    method: string
  ): asserts value is T {
    if (value === undefined) {
      // eslint-disable-next-line
      throw new Error(`Telegraf: "${method}" isn't available for "${this.updateType}::${this.updateSubTypes}"`)
    }
  }

  answerInlineQuery(...args: Shorthand<'answerInlineQuery'>) {
    this.assert(this.inlineQuery, 'answerInlineQuery')
    return this.telegram.answerInlineQuery(this.inlineQuery.id, ...args)
  }

  answerCbQuery(...args: Shorthand<'answerCbQuery'>) {
    this.assert(this.callbackQuery, 'answerCbQuery')
    return this.telegram.answerCbQuery(this.callbackQuery.id, ...args)
  }

  answerGameQuery(...args: Shorthand<'answerGameQuery'>) {
    this.assert(this.callbackQuery, 'answerGameQuery')
    return this.telegram.answerGameQuery(this.callbackQuery.id, ...args)
  }

  answerShippingQuery(...args: Shorthand<'answerShippingQuery'>) {
    this.assert(this.shippingQuery, 'answerShippingQuery')
    return this.telegram.answerShippingQuery(this.shippingQuery.id, ...args)
  }

  answerPreCheckoutQuery(...args: Shorthand<'answerPreCheckoutQuery'>) {
    this.assert(this.preCheckoutQuery, 'answerPreCheckoutQuery')
    return this.telegram.answerPreCheckoutQuery(
      this.preCheckoutQuery.id,
      ...args
    )
  }

  editMessageText(text: string, extra?: tt.ExtraEditMessage) {
    this.assert(this.callbackQuery ?? this.inlineMessageId, 'editMessageText')
    return this.telegram.editMessageText(
      this.chat?.id,
      this.callbackQuery?.message?.message_id,
      this.inlineMessageId,
      text,
      extra
    )
  }

  editMessageCaption(
    caption: string | undefined,
    extra?: tt.InlineKeyboardMarkup
  ) {
    this.assert(
      this.callbackQuery ?? this.inlineMessageId,
      'editMessageCaption'
    )
    return this.telegram.editMessageCaption(
      this.chat?.id,
      this.callbackQuery?.message?.message_id,
      this.inlineMessageId,
      caption,
      extra
    )
  }

  editMessageMedia(media: tt.MessageMedia, extra?: tt.ExtraEditMessage) {
    this.assert(this.callbackQuery ?? this.inlineMessageId, 'editMessageMedia')
    return this.telegram.editMessageMedia(
      this.chat?.id,
      this.callbackQuery?.message?.message_id,
      this.inlineMessageId,
      media,
      extra
    )
  }

  editMessageReplyMarkup(markup: tt.InlineKeyboardMarkup | undefined) {
    this.assert(
      this.callbackQuery ?? this.inlineMessageId,
      'editMessageReplyMarkup'
    )
    return this.telegram.editMessageReplyMarkup(
      this.chat?.id,
      this.callbackQuery?.message?.message_id,
      this.inlineMessageId,
      markup
    )
  }

  editMessageLiveLocation(
    latitude: number,
    longitude: number,
    markup?: tt.InlineKeyboardMarkup
  ) {
    this.assert(
      this.callbackQuery ?? this.inlineMessageId,
      'editMessageLiveLocation'
    )
    return this.telegram.editMessageLiveLocation(
      latitude,
      longitude,
      this.chat?.id,
      this.callbackQuery?.message?.message_id,
      this.inlineMessageId,
      markup
    )
  }

  stopMessageLiveLocation(markup?: tt.InlineKeyboardMarkup) {
    this.assert(
      this.callbackQuery ?? this.inlineMessageId,
      'stopMessageLiveLocation'
    )
    return this.telegram.stopMessageLiveLocation(
      this.chat?.id,
      this.callbackQuery?.message?.message_id,
      this.inlineMessageId,
      markup
    )
  }

  reply(...args: Shorthand<'sendMessage'>) {
    this.assert(this.chat, 'reply')
    return this.telegram.sendMessage(this.chat.id, ...args)
  }

  getChat(...args: Shorthand<'getChat'>) {
    this.assert(this.chat, 'getChat')
    return this.telegram.getChat(this.chat.id, ...args)
  }

  exportChatInviteLink(...args: Shorthand<'exportChatInviteLink'>) {
    this.assert(this.chat, 'exportChatInviteLink')
    return this.telegram.exportChatInviteLink(this.chat.id, ...args)
  }

  kickChatMember(...args: Shorthand<'kickChatMember'>) {
    this.assert(this.chat, 'kickChatMember')
    return this.telegram.kickChatMember(this.chat.id, ...args)
  }

  unbanChatMember(...args: Shorthand<'unbanChatMember'>) {
    this.assert(this.chat, 'unbanChatMember')
    return this.telegram.unbanChatMember(this.chat.id, ...args)
  }

  restrictChatMember(...args: Shorthand<'restrictChatMember'>) {
    this.assert(this.chat, 'restrictChatMember')
    return this.telegram.restrictChatMember(this.chat.id, ...args)
  }

  promoteChatMember(...args: Shorthand<'promoteChatMember'>) {
    this.assert(this.chat, 'promoteChatMember')
    return this.telegram.promoteChatMember(this.chat.id, ...args)
  }

  setChatAdministratorCustomTitle(
    ...args: Shorthand<'setChatAdministratorCustomTitle'>
  ) {
    this.assert(this.chat, 'setChatAdministratorCustomTitle')
    return this.telegram.setChatAdministratorCustomTitle(this.chat.id, ...args)
  }

  setChatPhoto(...args: Shorthand<'setChatPhoto'>) {
    this.assert(this.chat, 'setChatPhoto')
    return this.telegram.setChatPhoto(this.chat.id, ...args)
  }

  deleteChatPhoto(...args: Shorthand<'deleteChatPhoto'>) {
    this.assert(this.chat, 'deleteChatPhoto')
    return this.telegram.deleteChatPhoto(this.chat.id, ...args)
  }

  setChatTitle(...args: Shorthand<'setChatTitle'>) {
    this.assert(this.chat, 'setChatTitle')
    return this.telegram.setChatTitle(this.chat.id, ...args)
  }

  setChatDescription(...args: Shorthand<'setChatDescription'>) {
    this.assert(this.chat, 'setChatDescription')
    return this.telegram.setChatDescription(this.chat.id, ...args)
  }

  pinChatMessage(...args: Shorthand<'pinChatMessage'>) {
    this.assert(this.chat, 'pinChatMessage')
    return this.telegram.pinChatMessage(this.chat.id, ...args)
  }

  unpinChatMessage(...args: Shorthand<'unpinChatMessage'>) {
    this.assert(this.chat, 'unpinChatMessage')
    return this.telegram.unpinChatMessage(this.chat.id, ...args)
  }

  leaveChat(...args: Shorthand<'leaveChat'>) {
    this.assert(this.chat, 'leaveChat')
    return this.telegram.leaveChat(this.chat.id, ...args)
  }

  setChatPermissions(...args: Shorthand<'setChatPermissions'>) {
    this.assert(this.chat, 'setChatPermissions')
    return this.telegram.setChatPermissions(this.chat.id, ...args)
  }

  getChatAdministrators(...args: Shorthand<'getChatAdministrators'>) {
    this.assert(this.chat, 'getChatAdministrators')
    return this.telegram.getChatAdministrators(this.chat.id, ...args)
  }

  getChatMember(...args: Shorthand<'getChatMember'>) {
    this.assert(this.chat, 'getChatMember')
    return this.telegram.getChatMember(this.chat.id, ...args)
  }

  getChatMembersCount(...args: Shorthand<'getChatMembersCount'>) {
    this.assert(this.chat, 'getChatMembersCount')
    return this.telegram.getChatMembersCount(this.chat.id, ...args)
  }

  setPassportDataErrors(errors) {
    this.assert(this.from, 'setPassportDataErrors')
    return this.telegram.setPassportDataErrors(this.from.id, errors)
  }

  replyWithPhoto(...args: Shorthand<'sendPhoto'>) {
    this.assert(this.chat, 'replyWithPhoto')
    return this.telegram.sendPhoto(this.chat.id, ...args)
  }

  replyWithMediaGroup(...args: Shorthand<'sendMediaGroup'>) {
    this.assert(this.chat, 'replyWithMediaGroup')
    return this.telegram.sendMediaGroup(this.chat.id, ...args)
  }

  replyWithAudio(...args: Shorthand<'sendAudio'>) {
    this.assert(this.chat, 'replyWithAudio')
    return this.telegram.sendAudio(this.chat.id, ...args)
  }

  replyWithDice(...args: Shorthand<'sendDice'>) {
    this.assert(this.chat, 'replyWithDice')
    return this.telegram.sendDice(this.chat.id, ...args)
  }

  replyWithDocument(...args: Shorthand<'sendDocument'>) {
    this.assert(this.chat, 'replyWithDocument')
    return this.telegram.sendDocument(this.chat.id, ...args)
  }

  replyWithSticker(...args: Shorthand<'sendSticker'>) {
    this.assert(this.chat, 'replyWithSticker')
    return this.telegram.sendSticker(this.chat.id, ...args)
  }

  replyWithVideo(...args: Shorthand<'sendVideo'>) {
    this.assert(this.chat, 'replyWithVideo')
    return this.telegram.sendVideo(this.chat.id, ...args)
  }

  replyWithAnimation(...args: Shorthand<'sendAnimation'>) {
    this.assert(this.chat, 'replyWithAnimation')
    return this.telegram.sendAnimation(this.chat.id, ...args)
  }

  replyWithVideoNote(...args: Shorthand<'sendVideoNote'>) {
    this.assert(this.chat, 'replyWithVideoNote')
    return this.telegram.sendVideoNote(this.chat.id, ...args)
  }

  replyWithInvoice(...args: Shorthand<'sendInvoice'>) {
    this.assert(this.chat, 'replyWithInvoice')
    return this.telegram.sendInvoice(this.chat.id, ...args)
  }

  replyWithGame(...args: Shorthand<'sendGame'>) {
    this.assert(this.chat, 'replyWithGame')
    return this.telegram.sendGame(this.chat.id, ...args)
  }

  replyWithVoice(...args: Shorthand<'sendVoice'>) {
    this.assert(this.chat, 'replyWithVoice')
    return this.telegram.sendVoice(this.chat.id, ...args)
  }

  replyWithPoll(...args: Shorthand<'sendPoll'>) {
    this.assert(this.chat, 'replyWithPoll')
    return this.telegram.sendPoll(this.chat.id, ...args)
  }

  replyWithQuiz(...args: Shorthand<'sendQuiz'>) {
    this.assert(this.chat, 'replyWithQuiz')
    return this.telegram.sendQuiz(this.chat.id, ...args)
  }

  stopPoll(...args: Shorthand<'stopPoll'>) {
    this.assert(this.chat, 'stopPoll')
    return this.telegram.stopPoll(this.chat.id, ...args)
  }

  replyWithChatAction(...args: Shorthand<'sendChatAction'>) {
    this.assert(this.chat, 'replyWithChatAction')
    return this.telegram.sendChatAction(this.chat.id, ...args)
  }

  replyWithLocation(...args: Shorthand<'sendLocation'>) {
    this.assert(this.chat, 'replyWithLocation')
    return this.telegram.sendLocation(this.chat.id, ...args)
  }

  replyWithVenue(...args: Shorthand<'sendVenue'>) {
    this.assert(this.chat, 'replyWithVenue')
    return this.telegram.sendVenue(this.chat.id, ...args)
  }

  replyWithContact(...args: Shorthand<'sendContact'>) {
    this.assert(this.chat, 'replyWithContact')
    return this.telegram.sendContact(this.chat.id, ...args)
  }

  getStickerSet(setName: string) {
    return this.telegram.getStickerSet(setName)
  }

  setChatStickerSet(setName: string) {
    this.assert(this.chat, 'setChatStickerSet')
    return this.telegram.setChatStickerSet(this.chat.id, setName)
  }

  deleteChatStickerSet() {
    this.assert(this.chat, 'deleteChatStickerSet')
    return this.telegram.deleteChatStickerSet(this.chat.id)
  }

  setStickerPositionInSet(sticker: string, position: number) {
    return this.telegram.setStickerPositionInSet(sticker, position)
  }

  setStickerSetThumb(...args: Parameters<Telegram['setStickerSetThumb']>) {
    return this.telegram.setStickerSetThumb(...args)
  }

  deleteStickerFromSet(sticker: string) {
    return this.telegram.deleteStickerFromSet(sticker)
  }

  uploadStickerFile(...args: Shorthand<'uploadStickerFile'>) {
    this.assert(this.from, 'uploadStickerFile')
    return this.telegram.uploadStickerFile(this.from.id, ...args)
  }

  createNewStickerSet(...args: Shorthand<'createNewStickerSet'>) {
    this.assert(this.from, 'createNewStickerSet')
    return this.telegram.createNewStickerSet(this.from.id, ...args)
  }

  addStickerToSet(...args: Shorthand<'addStickerToSet'>) {
    this.assert(this.from, 'addStickerToSet')
    return this.telegram.addStickerToSet(this.from.id, ...args)
  }

  getMyCommands() {
    return this.telegram.getMyCommands()
  }

  setMyCommands(commands: readonly tt.BotCommand[]) {
    return this.telegram.setMyCommands(commands)
  }

  replyWithMarkdown(markdown: string, extra?: tt.ExtraEditMessage) {
    return this.reply(markdown, { parse_mode: 'Markdown', ...extra })
  }

  replyWithMarkdownV2(markdown: string, extra?: tt.ExtraEditMessage) {
    return this.reply(markdown, { parse_mode: 'MarkdownV2', ...extra })
  }

  replyWithHTML(html: string, extra?: tt.ExtraEditMessage) {
    return this.reply(html, { parse_mode: 'HTML', ...extra })
  }

  deleteMessage(messageId?: number) {
    this.assert(this.chat, 'deleteMessage')
    if (typeof messageId !== 'undefined') {
      return this.telegram.deleteMessage(this.chat.id, messageId)
    }
    this.assert(this.message, 'deleteMessage')
    return this.telegram.deleteMessage(this.chat.id, this.message.message_id)
  }

  forwardMessage(
    chatId: string | number,
    extra?: {
      disable_notification?: boolean
    }
  ) {
    this.assert(this.message, 'forwardMessage')
    return this.telegram.forwardMessage(
      chatId,
      this.message.chat.id,
      this.message.message_id,
      extra
    )
  }
}

export = TelegrafContext
