const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;
mongoose.connect('mongodb://localhost:27017/securityAnalysisDB',
{
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const analysisSchema = new mongoose.Schema(
{
  ip: String,
  nmapResults: String,
  metasploitResults: String,
});

const Analysis = mongoose.model('Analysis', analysisSchema);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.get('/', (req, res) =>
{
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/analyze', (req, res) => 
{
  const { ip } = req.body;
  const newAnalysis = new Analysis({ ip });
  newAnalysis.save();

  // Execute Nmap scan
  exec(`nmap ${ip}`, (nmapErr, nmapResults) =>
  {
    if (nmapErr) throw nmapErr;

    // Execute Metasploit module
    exec('msfconsole -r metasploit/msf_module.rb', (msfErr, metasploitResults) =>
    {
      if (msfErr) throw msfErr;


      Analysis.findByIdAndUpdate(
        newAnalysis._id,
        { nmapResults, metasploitResults },
        { new: true },
        (updateErr, updatedAnalysis) => 
        {
          if (updateErr) throw updateErr;

          res.send('Analysis completed successfully!');
        }
      );
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
