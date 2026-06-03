-- Allow site owners to delete any chat message (enables bot purge command).
CREATE POLICY "messages owner delete any"
ON public.chat_messages
FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_owner));