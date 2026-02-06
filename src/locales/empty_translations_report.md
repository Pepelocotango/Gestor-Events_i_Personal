# Informe de Traduccions Buides - Gestor d'Events i Personal

## Resum General
- **ca.json**: 111 claus buides
- **en.json**: 68 claus buides  
- **es.json**: 114 claus buides

---

## CATALÀ (ca.json) - 111 claus buides

### error_boundary
- error_details
- message
- reload_button
- title

### main
- add_event_frame
- add_event_tooltip
- archive.confirm_button
- archive.confirm_message_one
- archive.confirm_message_many
- archive.confirm_message_other
- archive.item_type
- archive.no_events
- archive.success_one
- archive.success_many
- archive.success_other
- archive.title
- archive_old
- archive_old_tooltip
- clean_filters
- collapse_all
- collapse_all_cards_tooltip
- contains_date
- csv_export
- expand_all
- expand_all_cards_tooltip
- export_csv_tooltip
- export_pdf_tooltip
- filter_date_label
- frame
- no_events_found
- pdf_export
- person
- place
- search_general
- search_placeholder
- show_archived
- show_archived_tooltip
- sort
- sort_tooltip
- status
- summaries
- tooltip_clean
- tooltip_date
- tooltip_frame
- tooltip_person
- tooltip_place
- tooltip_search
- tooltip_status

### main_display.event_details
- assignments_label_one
- assignments_label_many
- assignments_label_other

### main_display.update_assignments
- confirm_button_one
- confirm_button_many
- confirm_button_other

### pdf
- arrival
- arrival_time
- artist
- artist_info
- artist_name
- artist_type
- artistic_runsheet
- catering
- channel
- combined_schedule
- contact_email
- contact_name
- contact_phone
- date
- departure_time
- description
- dietary_requirements
- dressing_rooms
- duration
- event_info
- event_name
- event_runsheet_title
- general_notes
- general_schedule
- hospitality
- input_list
- label
- lighting_notes
- location
- mic_contra
- mic_rider
- no_performances
- notes
- parking
- patch
- performance_rider_title
- regidoria_notes
- regidoria_summary_title
- schedule
- show
- show_time
- soundcheck
- soundcheck_time
- stage_requirements
- stand
- status
- technical_notes
- time
- travel_logistics
- type
- video_notes

### performances
- add_button
- has_tech_data
- select_event

### tech_sheets.update_assignments
- changes_applied_toast_one
- changes_applied_toast_many
- changes_applied_toast_other

---

## ANGLÈS (en.json) - 68 claus buides

### error_boundary
- error_details
- message
- reload_button
- title

### main.archive
- confirm_message_one
- confirm_message_other
- success_one
- success_other

### main_display.event_details
- assignments_label_one
- assignments_label_other

### main_display.update_assignments
- confirm_button_one
- confirm_button_other

### pdf
- arrival
- arrival_time
- artist
- artist_info
- artist_name
- artist_type
- artistic_runsheet
- catering
- channel
- combined_schedule
- contact_email
- contact_name
- contact_phone
- date
- departure_time
- description
- dietary_requirements
- dressing_rooms
- duration
- event_info
- event_name
- event_runsheet_title
- general_notes
- general_schedule
- hospitality
- input_list
- label
- lighting_notes
- location
- mic_contra
- mic_rider
- no_performances
- notes
- parking
- patch
- performance_rider_title
- regidoria_notes
- regidoria_summary_title
- schedule
- show
- show_time
- soundcheck
- soundcheck_time
- stage_requirements
- stand
- status
- technical_notes
- time
- travel_logistics
- type
- video_notes

### performances
- has_tech_data
- select_event

### tech_sheets.update_assignments
- changes_applied_toast_one
- changes_applied_toast_other

---

## ESPANYOL (es.json) - 114 claus buides

### error_boundary
- error_details
- message
- reload_button
- title

### main
- add_event_frame
- add_event_tooltip
- archive.confirm_message_one
- archive.confirm_message_many
- archive.confirm_message_other
- archive.success_one
- archive.success_many
- archive.success_other
- clean_filters
- collapse_all
- collapse_all_cards_tooltip
- contains_date
- csv_export
- expand_all
- expand_all_cards_tooltip
- export_csv_tooltip
- export_pdf_tooltip
- filter_date_label
- frame
- no_events_found
- pdf_export
- person
- place
- search_general
- search_placeholder
- show_archived
- show_archived_tooltip
- sort
- sort_tooltip
- status
- summaries
- tooltip_clean
- tooltip_date
- tooltip_frame
- tooltip_person
- tooltip_place
- tooltip_search
- tooltip_status

### main_display.assignment_form
- conflict_detail
- duplicate_conflict
- title_edit_with_name
- title_new_with_name

### main_display.event_details
- assignments_label_one
- assignments_label_many
- assignments_label_other

### main_display.pdf_preview
- title_override

### main_display.update_assignments
- confirm_button_one
- confirm_button_many
- confirm_button_other

### pdf
- arrival
- arrival_time
- artist
- artist_info
- artist_name
- artist_type
- artistic_runsheet
- catering
- channel
- combined_schedule
- contact_email
- contact_name
- contact_phone
- date
- departure_time
- description
- dietary_requirements
- dressing_rooms
- duration
- event_info
- event_name
- event_runsheet_title
- general_notes
- general_schedule
- hospitality
- input_list
- label
- lighting_notes
- location
- mic_contra
- mic_rider
- no_performances
- notes
- parking
- patch
- performance_rider_title
- regidoria_notes
- regidoria_summary_title
- schedule
- show
- show_time
- soundcheck
- soundcheck_time
- stage_requirements
- stand
- status
- technical_notes
- time
- travel_logistics
- type
- video_notes

### performances
- add_button
- has_tech_data
- select_event

### roles (tota la secció)
- assembly.crew
- assembly.driver
- assembly.helper
- assembly.machinery
- assembly.rigger
- audience.box_office
- audience.floor_staff
- audience.security
- direction.chief
- direction.council
- direction.council_assistant
- direction.floor_manager
- production.assistant
- production.producer
- support.personal
- support.rider
- technician.camera
- technician.lighting
- technician.machinery
- technician.microphone
- technician.monitors
- technician.pa
- technician.sound
- technician.video

### tech_sheets.update_assignments
- changes_applied_toast_one
- changes_applied_toast_many
- changes_applied_toast_other

---

## Anàlisi de Diferències

### Claus que només falten en català/espanyol (no en anglès):
- Tota la secció `main` (add_event_frame, tooltips, etc.)
- `performances.add_button`

### Claus que només falten en espanyol:
- `main_display.assignment_form` (4 claus)
- `main_display.pdf_preview.title_override`
- Tota la secció `roles` (22 claus)

### Claus que falten en tots tres idiomes:
- `error_boundary` (4 claus)
- `pdf` (53 claus)
- `performances.has_tech_data`, `performances.select_event`
- `tech_sheets.update_assignments` (3 claus)
- Algunes claus de pluralització

---

## Recomanacions

1. **Prioritat alta**: `error_boundary` - claus crítiques per a la gestió d'errors
2. **Prioritat mitjana**: `pdf` - afecta l'exportació de documents
3. **Prioritat baixa**: `main` - elements d'interfície menys crítics
4. **Especific espanyol**: Traduir tota la secció `roles`

## Estadístiques
- **Total claus buides**: 293
- **Claus comunes als 3 idiomes**: ~65
- **Claus específiques espanyol**: 26 (secció roles)
- **Percentatge traduccions completes**:
  - Anglès: ~94% complet
  - Català: ~91% complet  
  - Espanyol: ~90% complet
