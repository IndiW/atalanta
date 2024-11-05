'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Button, 
  TextField, 
  Typography, 
  Box, 
  ThemeProvider, 
  createTheme, 
  CssBaseline,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
  alpha
} from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import RefreshIcon from '@mui/icons-material/Refresh'
import TimerIcon from '@mui/icons-material/Timer'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import VolumeOffIcon from '@mui/icons-material/VolumeOff'
import SaveIcon from '@mui/icons-material/Save'
import SettingsIcon from '@mui/icons-material/Settings'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import beepSound from '/beep-2.wav'

let audioPool: HTMLAudioElement[] | null = null

const initAudioPool = () => {
  if (audioPool) return audioPool
  
  audioPool = Array.from({ length: 3 }, () => {
    const audio = new Audio(beepSound)
    audio.preload = 'auto'
    audio.load()
    return audio
  })
  return audioPool
}

export default function Stopwatch() {
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isCountdown, setIsCountdown] = useState(false)
  const [countdownTime, setCountdownTime] = useState(60000) // in milliseconds
  const [repeats, setRepeats] = useState(1)
  const [currentRepeat, setCurrentRepeat] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [autoStopTime, setAutoStopTime] = useState(0) // in milliseconds
  const [isTimeLimitReached, setIsTimeLimitReached] = useState(false)
  const [playSoundOnStop, setPlaySoundOnStop] = useState(true)
  const [savedTimes, setSavedTimes] = useState<number[]>([])
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSavedTimesOpen, setIsSavedTimesOpen] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const [pausedTime, setPausedTime] = useState<number>(0)

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: isDarkMode ? '#ffffff' : '#000000',
      },
      background: {
        default: isDarkMode ? '#121212' : '#ffffff',
        paper: isDarkMode ? '#181818' : '#f5f5f5',
      },
      text: {
        primary: isDarkMode ? '#ffffff' : '#000000',
        secondary: isDarkMode ? '#b3b3b3' : '#6a6a6a',
      },
    },
    components: {
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
              },
              '&:hover fieldset': {
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
              },
              '&.Mui-focused fieldset': {
                borderColor: isDarkMode ? '#ffffff' : '#000000',
              },
            },
            '& .MuiInputLabel-root': {
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
            },
            '& .MuiInputBase-input': {
              color: isDarkMode ? '#ffffff' : '#000000',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 500,
            padding: '6px 16px',
          },
          contained: {
            backgroundColor: isDarkMode ? '#ffffff' : '#000000',
            color: isDarkMode ? '#000000' : '#ffffff',
            '&:hover': {
              backgroundColor: isDarkMode ? alpha('#ffffff', 0.8) : alpha('#000000', 0.8),
            },
          },
          outlined: {
            borderColor: isDarkMode ? '#ffffff' : '#000000',
            color: isDarkMode ? '#ffffff' : '#000000',
            '&:hover': {
              backgroundColor: isDarkMode ? alpha('#ffffff', 0.08) : alpha('#000000', 0.08),
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
  })

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor((time % 3600000) / 60000)
    const seconds = Math.floor((time % 60000) / 1000)
    const milliseconds = time % 1000
    return `${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds
      .toString()
      .padStart(3, '0')}`
  }, [])

  useEffect(() => {
    let timeoutId: number | null = null
    let animationFrameId: number | null = null

    const updateTimer = () => {
      if (!isRunning) return

      const currentTime = Date.now()
      const elapsedTime = currentTime - startTime + pausedTime

      if (isCountdown) {
        const remainingTime = countdownTime - elapsedTime
        if (remainingTime <= 0) {
          if (currentRepeat < repeats - 1) {
            setCurrentRepeat(prev => prev + 1)
            setStartTime(currentTime)
            setPausedTime(0)
            setTime(countdownTime)
          } else {
            playSound()
            setIsRunning(false)
            setCurrentRepeat(0)
            setIsTimeLimitReached(true)
            setTime(0)
            return
          }
        } else {
          setTime(remainingTime)
        }
      } else {
        setTime(elapsedTime)
        if (autoStopTime > 0 && elapsedTime >= autoStopTime) {
          playSound()
          setIsRunning(false)
          setIsTimeLimitReached(true)
          setTime(autoStopTime)
          return
        }
      }

      // Use both setTimeout and requestAnimationFrame for better precision
      timeoutId = window.setTimeout(() => {
        animationFrameId = requestAnimationFrame(updateTimer)
      }, 0)
    }

    if (isRunning) {
      if (startTime === 0) {
        setStartTime(Date.now())
      }
      animationFrameId = requestAnimationFrame(updateTimer)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [isRunning, isCountdown, countdownTime, repeats, currentRepeat, autoStopTime, startTime, pausedTime])

  const handleStartPause = () => {
    if (isTimeLimitReached) return
    
    if (isRunning) {
      // Pausing
      setPausedTime(prev => prev + (Date.now() - startTime))
      setStartTime(0)
    } else {
      // Starting
      setStartTime(Date.now())
    }
    setIsRunning(!isRunning)
    setIsTimeLimitReached(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTime(isCountdown ? countdownTime : 0)
    setStartTime(0)
    setPausedTime(0)
    setCurrentRepeat(0)
    setIsTimeLimitReached(false)
  }

  const toggleMode = () => {
    setIsCountdown(!isCountdown)
    setTime(0)
    setStartTime(0)
    setPausedTime(0)
    setAutoStopTime(0)
    setIsTimeLimitReached(false)
  }

  const toggleTheme = () => setIsDarkMode(!isDarkMode)

  const handleAutoStopChange = (seconds: number, milliseconds: number) => {
    const safeSeconds = isNaN(seconds) ? 0 : Math.max(0, seconds)
    const safeMilliseconds = isNaN(milliseconds) ? 0 : Math.max(0, Math.min(999, milliseconds))
    const totalMilliseconds = safeSeconds * 1000 + safeMilliseconds
    setAutoStopTime(totalMilliseconds)
  }

  const handleCountdownChange = (seconds: number, milliseconds: number) => {
    const safeSeconds = isNaN(seconds) ? 0 : Math.max(0, seconds)
    const safeMilliseconds = isNaN(milliseconds) ? 0 : Math.max(0, Math.min(999, milliseconds))
    const totalMilliseconds = safeSeconds * 1000 + safeMilliseconds
    setCountdownTime(totalMilliseconds)
    setTime(totalMilliseconds)
  }

  const handleSaveTime = () => {
    setSavedTimes(prevTimes => [...prevTimes, time])
  }

  // Update the playSound function
  const playSound = useCallback(() => {
    if (!playSoundOnStop || !audioPool) return
    
    const availableAudio = audioPool.find(audio => audio.paused)
    if (availableAudio) {
      availableAudio.currentTime = 0
      availableAudio.play().catch(console.error)
      availableAudio.currentTime = 0
    } else {
      audioPool[0].currentTime = 0
      audioPool[0].play().catch(console.error)
      audioPool[0].currentTime = 0
    }
  }, [playSoundOnStop])

  const handleRepeatsChange = (value: string) => {
    const numValue = parseInt(value)
    setRepeats(isNaN(numValue) ? 1 : Math.max(1, numValue))
  }

  // Initialize audio pool on first render
  useEffect(() => {
    initAudioPool()
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          width: '100vw',
          p: 3,
          bgcolor: 'background.default',
          color: 'text.primary',
        }}
      >
        <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
          <IconButton onClick={() => setIsSettingsOpen(!isSettingsOpen)} color="primary">
            <SettingsIcon />
          </IconButton>
        </Box>

        <Collapse in={isSettingsOpen}>
          <Box sx={{ position: 'absolute', top: 64, left: 16, bgcolor: 'background.paper', p: 2, borderRadius: 2, boxShadow: 3 }}>
            <Stack direction="column" spacing={2}>
              <Button
                variant="text"
                onClick={toggleMode}
                startIcon={<TimerIcon />}
                fullWidth
              >
                {isCountdown ? 'Switch to Stopwatch' : 'Switch to Countdown'}
              </Button>
              <Button
                variant="text"
                onClick={toggleTheme}
                startIcon={isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                fullWidth
              >
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </Button>
              <IconButton onClick={() => setPlaySoundOnStop(!playSoundOnStop)} color="primary">
                {playSoundOnStop ? <VolumeUpIcon /> : <VolumeOffIcon />}
              </IconButton>
            </Stack>
          </Box>
        </Collapse>

        <Typography variant="h1" gutterBottom sx={{ fontWeight: 'bold', letterSpacing: 2, fontSize: '4rem' }}>
          {formatTime(time)}
        </Typography>
        
        <Stack direction="row" spacing={2} mb={4} width="100%">
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleStartPause}
            startIcon={isRunning ? <PauseIcon /> : <PlayArrowIcon />}
            sx={{ minWidth: '100px' }}
            disabled={isTimeLimitReached}
          >
            {isRunning ? 'Pause' : 'Start'}
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleReset}
            startIcon={<RefreshIcon />}
          >
            Reset
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleSaveTime}
            startIcon={<SaveIcon />}
          >
            Save
          </Button>
        </Stack>

        <Box sx={{ width: '100%', mb: 4 }}>
          {isCountdown ? (
            <Stack direction="row" spacing={2}>
              <TextField
                label="Seconds"
                type="number"
                value={Math.floor(countdownTime / 1000)}
                onChange={(e) => handleCountdownChange(parseInt(e.target.value), countdownTime % 1000)}
                variant="outlined"
                size="small"
                fullWidth
                inputProps={{ min: 0 }}
              />
              <TextField
                label="Milliseconds"
                type="number"
                value={countdownTime % 1000}
                onChange={(e) => handleCountdownChange(Math.floor(countdownTime / 1000), parseInt(e.target.value))}
                variant="outlined"
                size="small"
                fullWidth
              />
              <TextField
                label="Repeats"
                type="number"
                value={repeats}
                onChange={(e) => handleRepeatsChange(e.target.value)}
                variant="outlined"
                size="small"
                fullWidth
                inputProps={{ min: 1 }}
              />
            </Stack>
          ) : (
            <Stack direction="row" spacing={2}>
              <TextField
                label="Auto-stop Seconds"
                type="number"
                value={Math.floor(autoStopTime / 1000)}
                onChange={(e) => handleAutoStopChange(parseInt(e.target.value), autoStopTime % 1000)}
                variant="outlined"
                size="small"
                fullWidth
              />
              <TextField
                label="Auto-stop Milliseconds"
                type="number"
                value={autoStopTime % 1000}
                onChange={(e) => handleAutoStopChange(Math.floor(autoStopTime / 1000), parseInt(e.target.value))}
                variant="outlined"
                size="small"
                fullWidth
              />
            </Stack>
          )}
        </Box>

        {isCountdown && repeats > 1 && (
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Current Repeat: {currentRepeat + 1} / {repeats}
          </Typography>
        )}

        <Box sx={{ width: '100%', maxWidth: 600, mt: 4 }}>
          <Button
            variant="text"
            onClick={() => setIsSavedTimesOpen(!isSavedTimesOpen)}
            endIcon={isSavedTimesOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            fullWidth
            sx={{ justifyContent: 'space-between', mb: 1 }}
          >
            Saved Times
          </Button>
          <Collapse in={isSavedTimesOpen}>
            <TableContainer component={Paper} sx={{ bgcolor: 'background.paper', boxShadow: 'none' }}>
              <Table size="small" aria-label="saved times table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>#</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {savedTimes.map((savedTime, index) => (
                    <TableRow 
                      key={index}
                      sx={{ '&:hover': { bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' } }}
                    >
                      <TableCell component="th" scope="row" sx={{ color: 'text.secondary' }}>
                        {index + 1}
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>{formatTime(savedTime)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Collapse>
        </Box>
      </Box>
    </ThemeProvider>
  )
}