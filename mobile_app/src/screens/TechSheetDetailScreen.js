"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TechSheetDetailScreen;
var react_1 = require("react");
var react_native_1 = require("react-native");
var dataStore_1 = require("../stores/dataStore");
var ReadOnlyField_1 = require("../components/tech_sheet/ReadOnlyField");
var dateFormat_1 = require("../utils/dateFormat");
var CollapsibleSection_1 = require("../components/CollapsibleSection");
var MaterialCommunityIcons_1 = require("react-native-vector-icons/MaterialCommunityIcons");
var themes_1 = require("../utils/themes");
function TechSheetDetailScreen(_a) {
    var _b, _c, _d, _e, _f, _g;
    var route = _a.route;
    var eventId = (_b = route.params) === null || _b === void 0 ? void 0 : _b.eventId;
    var _h = (0, dataStore_1.useDataStore)(), eventFrames = _h.eventFrames, peopleGroups = _h.peopleGroups, materialItems = _h.materialItems, theme = _h.theme;
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var event = eventFrames.find(function (e) { return e.id === eventId; });
    var techSheet = event === null || event === void 0 ? void 0 : event.techSheet;
    var sectionKeys = (0, react_1.useMemo)(function () {
        var _a, _b, _c, _d, _e, _f;
        if (!techSheet)
            return [];
        var keys = new Set();
        if (techSheet.eventName)
            keys.add('general');
        if (techSheet.generalNotes)
            keys.add('generalNotes');
        if (((_a = techSheet.preAssembly) === null || _a === void 0 ? void 0 : _a.status) === 'yes')
            keys.add('preAssembly');
        if (((_b = techSheet.schedule) === null || _b === void 0 ? void 0 : _b.status) === 'yes')
            keys.add('schedule');
        if (((_c = techSheet.parking) === null || _c === void 0 ? void 0 : _c.status) === 'yes' || ((_d = techSheet.dressingRooms) === null || _d === void 0 ? void 0 : _d.status) === 'yes' || ((_e = techSheet.actorsInfo) === null || _e === void 0 ? void 0 : _e.status) === 'yes' || ((_f = techSheet.techniciansInfo) === null || _f === void 0 ? void 0 : _f.status) === 'yes')
            keys.add('logistics');
        if (techSheet.technicalProviders && techSheet.technicalProviders.length > 0)
            keys.add('personnel');
        if (techSheet.technicalNeedsNotes)
            keys.add('technicalNeedsNotes');
        var needsSections = ['lighting', 'sound', 'video', 'machinery', 'rentals', 'otherEquipment', 'electrical', 'structures', 'platforms', 'consumables', 'curtains', 'transport'];
        needsSections.forEach(function (key) {
            var _a;
            if (((_a = techSheet[key]) === null || _a === void 0 ? void 0 : _a.status) === 'yes')
                keys.add(key);
        });
        if (techSheet.controlLocation || techSheet.blueprints)
            keys.add('otherDetails');
        if (techSheet.contacts && techSheet.contacts.length > 0)
            keys.add('contacts');
        if (techSheet.observations)
            keys.add('observations');
        return Array.from(keys);
    }, [techSheet]);
    var _j = (0, react_1.useState)({}), expandedSections = _j[0], setExpandedSections = _j[1];
    var handleToggleSection = function (sectionKey) {
        setExpandedSections(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[sectionKey] = !prev[sectionKey], _a)));
        });
    };
    var areAllExpanded = (0, react_1.useMemo)(function () {
        if (sectionKeys.length === 0)
            return false;
        return sectionKeys.every(function (key) { return expandedSections[key]; });
    }, [expandedSections, sectionKeys]);
    var toggleAllSections = function () {
        if (areAllExpanded) {
            setExpandedSections({});
        }
        else {
            var allExpanded_1 = {};
            sectionKeys.forEach(function (key) { allExpanded_1[key] = true; });
            setExpandedSections(allExpanded_1);
        }
    };
    var dynamicStyles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background, padding: 8 },
        centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: colors.background },
        text: { color: colors.text },
        providerName: { fontWeight: 'bold', fontSize: 16, marginTop: 8, color: colors.text },
        needItem: { paddingVertical: 4 },
        needDescription: { fontSize: 14, color: colors.text },
        notes: { fontStyle: 'italic', marginBottom: 8, color: colors.text, opacity: 0.8 },
        contactContainer: { marginBottom: 10 },
        toolbar: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 8,
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            marginBottom: 10,
        },
        button: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
        },
        buttonText: {
            marginLeft: 8,
            fontSize: 14,
            color: colors.text,
        },
    }); }, [colors]);
    if (!event) {
        return <react_native_1.View style={dynamicStyles.centerContainer}><react_native_1.Text style={dynamicStyles.text}>No s'ha trobat l'esdeveniment.</react_native_1.Text></react_native_1.View>;
    }
    if (!techSheet) {
        return <react_native_1.View style={dynamicStyles.centerContainer}><react_native_1.Text style={dynamicStyles.text}>Aquest esdeveniment no té fitxa de bolo associada.</react_native_1.Text></react_native_1.View>;
    }
    var getPersonName = function (personGroupId) { var _a; return ((_a = peopleGroups.find(function (p) { return p.id === personGroupId; })) === null || _a === void 0 ? void 0 : _a.name) || 'Desconegut'; };
    var getMaterialName = function (materialId) { var _a; return !materialId ? 'N/A' : (((_a = materialItems.find(function (i) { return i.id === materialId; })) === null || _a === void 0 ? void 0 : _a.name) || 'Material desconegut'); };
    var renderNeedsSection = function (title, sectionKey, section) {
        var _a;
        if (!section || section.status !== 'yes')
            return null;
        var hasNeeds = section.needs && section.needs.length > 0;
        return (<CollapsibleSection_1.default title={title} isExpanded={!!expandedSections[sectionKey]} onToggle={function () { return handleToggleSection(sectionKey); }}>
        {section.details && <react_native_1.Text style={dynamicStyles.notes}>{section.details}</react_native_1.Text>}
        {!hasNeeds && !section.details && <react_native_1.Text style={dynamicStyles.text}>Sense especificacions.</react_native_1.Text>}
        {hasNeeds && ((_a = section.needs) === null || _a === void 0 ? void 0 : _a.map(function (need) { return (<react_native_1.View key={need.id} style={dynamicStyles.needItem}>
            <react_native_1.Text style={dynamicStyles.needDescription}>- {need.quantity}x {need.description || getMaterialName(need.materialItemId)} ({need.origin})</react_native_1.Text>
          </react_native_1.View>); }))}
      </CollapsibleSection_1.default>);
    };
    var renderPersonnelInfoSection = function (label, section) {
        if (!section || section.status !== 'yes')
            return null;
        var value = '';
        if (section.data) {
            value = "N\u00FAmero: ".concat(section.data.number || 'N/A');
            if (section.data.names)
                value += ", Noms: ".concat(section.data.names);
        }
        if (section.details)
            value += "\nDetalls: ".concat(section.details);
        return <ReadOnlyField_1.default label={label} value={value || 'Sí'}/>;
    };
    return (<react_native_1.ScrollView style={dynamicStyles.container}>
      <react_native_1.View style={dynamicStyles.toolbar}>
        <react_native_1.TouchableOpacity style={dynamicStyles.button} onPress={toggleAllSections}>
            <MaterialCommunityIcons_1.default name={areAllExpanded ? 'arrow-collapse-vertical' : 'arrow-expand-vertical'} size={24} color={colors.text}/>
            <react_native_1.Text style={dynamicStyles.buttonText}>{areAllExpanded ? 'Replegar Totes' : 'Expandir Totes'}</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>

      <CollapsibleSection_1.default title="Informació General" isExpanded={!!expandedSections.general} onToggle={function () { return handleToggleSection('general'); }}>
        <ReadOnlyField_1.default label="Esdeveniment" value={techSheet.eventName}/>
        <ReadOnlyField_1.default label="Lloc" value={techSheet.location}/>
        <ReadOnlyField_1.default label="Data" value={(0, dateFormat_1.formatDate)(techSheet.date)}/>
        {techSheet.showTimes && techSheet.showTimes.length > 0 && <ReadOnlyField_1.default label="Hora Funció" value={techSheet.showTimes.map(function (st) { return st.time; }).join(', ')}/>}
        <ReadOnlyField_1.default label="Durada Espectacle" value={techSheet.showDuration}/>
      </CollapsibleSection_1.default>

      {techSheet.generalNotes && <CollapsibleSection_1.default title="Notes Generals" isExpanded={!!expandedSections.generalNotes} onToggle={function () { return handleToggleSection('generalNotes'); }}><react_native_1.Text style={dynamicStyles.text}>{techSheet.generalNotes}</react_native_1.Text></CollapsibleSection_1.default>}
      {((_c = techSheet.preAssembly) === null || _c === void 0 ? void 0 : _c.status) === 'yes' && <CollapsibleSection_1.default title="Premuntatge" isExpanded={!!expandedSections.preAssembly} onToggle={function () { return handleToggleSection('preAssembly'); }}><react_native_1.Text style={dynamicStyles.text}>{techSheet.preAssembly.details || 'Sí'}</react_native_1.Text></CollapsibleSection_1.default>}

      {sectionKeys.includes('logistics') &&
            <CollapsibleSection_1.default title="Logística" isExpanded={!!expandedSections.logistics} onToggle={function () { return handleToggleSection('logistics'); }}>
            {((_d = techSheet.parking) === null || _d === void 0 ? void 0 : _d.status) === 'yes' && <ReadOnlyField_1.default label="Pàrquing" value={techSheet.parking.details || 'Sí'}/>}
            {((_e = techSheet.dressingRooms) === null || _e === void 0 ? void 0 : _e.status) === 'yes' && <ReadOnlyField_1.default label="Camerinos" value={techSheet.dressingRooms.details || 'Sí'}/>}
            {renderPersonnelInfoSection('Intèrprets / Ponents', techSheet.actorsInfo)}
            {renderPersonnelInfoSection('Personal Tècnic (Client)', techSheet.techniciansInfo)}
        </CollapsibleSection_1.default>}

      {((_f = techSheet.schedule) === null || _f === void 0 ? void 0 : _f.status) === 'yes' &&
            <CollapsibleSection_1.default title="Horaris de Muntatge" isExpanded={!!expandedSections.schedule} onToggle={function () { return handleToggleSection('schedule'); }}>
          {techSheet.schedule.details && <react_native_1.Text style={dynamicStyles.notes}>{techSheet.schedule.details}</react_native_1.Text>}
          {(_g = techSheet.schedule.data) === null || _g === void 0 ? void 0 : _g.map(function (item) { return <ReadOnlyField_1.default key={item.id} label={"".concat((0, dateFormat_1.formatDate)(item.date), " ").concat(item.time).concat(item.timeEnd ? " - ".concat(item.timeEnd) : '')} value={item.description}/>; })}
        </CollapsibleSection_1.default>}

      {techSheet.technicalProviders && techSheet.technicalProviders.length > 0 &&
            <CollapsibleSection_1.default title="Personal Tècnic" isExpanded={!!expandedSections.personnel} onToggle={function () { return handleToggleSection('personnel'); }}>
          {techSheet.technicalPersonnelNotes && <react_native_1.Text style={dynamicStyles.notes}>{techSheet.technicalPersonnelNotes}</react_native_1.Text>}
          {techSheet.technicalProviders.map(function (provider) { return (<react_native_1.View key={provider.id} style={{ marginTop: 5 }}>
              <react_native_1.Text style={dynamicStyles.providerName}>{getPersonName(provider.personGroupId)}</react_native_1.Text>
              {provider.roles.map(function (role) { return <ReadOnlyField_1.default key={role.id} label={"    ".concat(role.role)} value={"".concat(role.quantity, " persona/es")}/>; })}
            </react_native_1.View>); })}
        </CollapsibleSection_1.default>}

      {techSheet.technicalNeedsNotes && <CollapsibleSection_1.default title="Notes de Necessitats Tècniques" isExpanded={!!expandedSections.technicalNeedsNotes} onToggle={function () { return handleToggleSection('technicalNeedsNotes'); }}><react_native_1.Text style={dynamicStyles.text}>{techSheet.technicalNeedsNotes}</react_native_1.Text></CollapsibleSection_1.default>}
      {renderNeedsSection('Il·luminació', 'lighting', techSheet.lighting)}
      {renderNeedsSection('So', 'sound', techSheet.sound)}
      {renderNeedsSection('Vídeo', 'video', techSheet.video)}
      {renderNeedsSection('Maquinària', 'machinery', techSheet.machinery)}
      {renderNeedsSection('Lloguers', 'rentals', techSheet.rentals)}
      {renderNeedsSection('Altre Equipament', 'otherEquipment', techSheet.otherEquipment)}
      {renderNeedsSection('Infraestructures Elèctriques', 'electrical', techSheet.electrical)}
      {renderNeedsSection('Estructures', 'structures', techSheet.structures)}
      {renderNeedsSection('Tarimes', 'platforms', techSheet.platforms)}
      {renderNeedsSection('Consumibles', 'consumables', techSheet.consumables)}
      {renderNeedsSection('Cortinatges', 'curtains', techSheet.curtains)}
      {renderNeedsSection('Transport', 'transport', techSheet.transport)}

      {sectionKeys.includes('otherDetails') &&
            <CollapsibleSection_1.default title="Altres Detalls" isExpanded={!!expandedSections.otherDetails} onToggle={function () { return handleToggleSection('otherDetails'); }}>
          <ReadOnlyField_1.default label="Ubicació Control" value={techSheet.controlLocation}/>
          <ReadOnlyField_1.default label="Plànols" value={techSheet.blueprints}/>
        </CollapsibleSection_1.default>}

      {techSheet.contacts && techSheet.contacts.length > 0 &&
            <CollapsibleSection_1.default title="Contactes" isExpanded={!!expandedSections.contacts} onToggle={function () { return handleToggleSection('contacts'); }}>
          {techSheet.contacts.map(function (contact) { return (<react_native_1.View key={contact.id} style={dynamicStyles.contactContainer}>
              <ReadOnlyField_1.default label="Nom" value={contact.name}/>
              <ReadOnlyField_1.default label="Rol" value={contact.role}/>
              <ReadOnlyField_1.default label="Telèfon" value={contact.phone}/>
              <ReadOnlyField_1.default label="Email" value={contact.email}/>
            </react_native_1.View>); })}
        </CollapsibleSection_1.default>}

      {techSheet.observations && <CollapsibleSection_1.default title="Observacions" isExpanded={!!expandedSections.observations} onToggle={function () { return handleToggleSection('observations'); }}><react_native_1.Text style={dynamicStyles.text}>{techSheet.observations}</react_native_1.Text></CollapsibleSection_1.default>}
    </react_native_1.ScrollView>);
}
