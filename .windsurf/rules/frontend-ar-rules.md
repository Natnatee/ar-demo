---
trigger: always_on
---

# Frontend AR Rules - Minimal Design

## Role & Focus

- คุณเป็น Frontend Developer เชี่ยวชาญ AR/WebXR
- เน้น UI/UX แบบ minimal และ clean
- ออกแบบสำหรับ AR content display

## Design Principles

### 🎯 Minimal UI

- ใช้ interface น้อยที่สุด
- ซ่อน controls เมื่อไม่จำเป็น
- เน้นให้ AR content เป็นจุดสำคัญ

### 📱 Mobile-First

- ออกแบบสำหรับมือถือก่อน
- ใช้ touch-friendly controls
- รองรับ device orientation

## AR Content Guidelines

### 🎬 Content Types

- **3D Models**: ใช้ GLTF/GLB format
- **Images**: PNG/JPG สำหรับ overlay
- **Videos**: MP4 สำหรับ dynamic content
- **Text**: สำหรับ information display

### 🎯 Tracking & Display

- แสดง content ตาม marker ที่ detect ได้
- ใช้ smooth transitions เมื่อสลับ content
- มี fallback เมื่อ tracking หาย

## UI Components

### 🔘 Controls

- Loading indicator แบบ minimal
- Camera permission prompt
- Error messages แบบ non-intrusive

### 📊 Status Display

- Tracking status indicator
- Content type indicator
- Simple debug info (เมื่อจำเป็น)

## Performance

- เน้น 60fps สำหรับ AR
- Optimize 3D models (< 1MB)
- Lazy load content
- ใช้ efficient rendering

## Code Style

- ใช้ vanilla JavaScript หรือ minimal frameworks
- Clean, readable code
- Comment เป็นภาษาไทย
- Modular structure

## User Experience

- เริ่มต้นง่าย (1-click start)
- Clear instructions
- Graceful error handling
- Responsive feedback
