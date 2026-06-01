DROP POLICY IF EXISTS "messages owner update" ON public.chat_messages;
CREATE POLICY "messages owner update" ON public.chat_messages
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_owner))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_owner));

DROP POLICY IF EXISTS "channels owner update" ON public.chat_channels;
CREATE POLICY "channels owner update" ON public.chat_channels
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_owner))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_owner));
