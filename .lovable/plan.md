
## Change Light Mode Background on /ikigai

The light mode background is currently set to pure white (`bg-white`) on line 139 of `src/pages/IkigaiCard.tsx`.

### Change
Update line 139 from:
```
const bgColor = isDarkMode ? 'bg-[#181818]' : 'bg-white';
```
to:
```
const bgColor = isDarkMode ? 'bg-[#181818]' : 'bg-[#ebe9e6]';
```

This is a single-line change affecting only the light mode background color.
